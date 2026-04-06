import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { get } from 'https';
import rateLimit from 'express-rate-limit';


const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 1,  // once per second
  message: "Please try again",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('.'));
app.use(limiter);
app.set("trust proxy", true);




const port = process.env.PORT || 3000;

function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function getCityInfo(cityName) {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'citiesDB.json'), 'utf-8'));

    for (const county of Object.values(data)) {
        const index = county.indexOf(cityName);
        if (index !== -1) {
            return [county[0], county[index - 1]];
        }
    }
    return null;
}

async function getIteniaryData(html) {
    try {
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        const routeRows = document.querySelectorAll('tr.routerow');
        const routes = [];
        
        routeRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => cell.textContent.trim());
            const combined = rowData.slice(1, 8).join('');
            const transformed = [
                rowData[0],
                combined,
                rowData[9]
            ];
            routes.push(transformed);
        });
        
        return routes;
    } catch (error) {
        console.error('Error loading or scraping departures:', error);
    }
}

function filterByDayOfTravel(routes, dayOfTravel) {
    return routes.filter(route => route[1].includes(dayOfTravel.toString()));
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function findMatchingRoutes(depActiveRoutes, destActiveRoutes, minWaitTime, maxWaitTime) {
    const results = [];
    for (const dep of depActiveRoutes) {
        for (const dest of destActiveRoutes) {
            const depTime = timeToMinutes(dep[2]);
            const destTime = timeToMinutes(dest[0]);
            
            if (depTime > destTime) continue;
            const diff = destTime - depTime;
            
            if (diff >= minWaitTime && diff <= maxWaitTime) {
                results.push([dep[0], dep[2], dest[0], dest[2], diff]);
            }
        }
    }
    return results.sort((a, b) => a[4] - b[4]);
}

app.post('/api/route', async (req, res) => {
    try {
        const { departureCity, destinationCity, dayOfTravel, minWaitTime, maxWaitTime } = req.body;
        
        console.log(req.get("host"));
        console.log(req.originalUrl);

        var requestedUrl = req.protocol + '://' + req.host + ':3000' + req.url;
        console.log(requestedUrl);

        if (departureCity == "" || destinationCity=="" || minWaitTime < 0 || maxWaitTime < 0 || isNaN(minWaitTime) || isNaN(maxWaitTime) || maxWaitTime <= minWaitTime || departureCity == destinationCity) {
            return res.json({ error: 'Data Error' });
        };


        const depCityCodes = getCityInfo(departureCity);
        if (!depCityCodes) {
            return res.json({ error: 'Δεν βρέθηκε η πόλη αναχώρησης' });
        }

        const destCityCodes = getCityInfo(destinationCity);
        if (!destCityCodes) {
            return res.json({ error: 'Δεν βρέθηκε η πόλη προορισμού' });
        }

        const depHtml = await fetchHtml(`https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid=${depCityCodes[0]}&print=1&from=${depCityCodes[1]}&to=0`);
        const depAllRoutes = await getIteniaryData(depHtml);

        const destHtml = await fetchHtml(`https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid=${destCityCodes[0]}&print=1&from=0&to=${destCityCodes[1]}`);
        const destAllRoutes = await getIteniaryData(destHtml);

        const result = findMatchingRoutes(
            filterByDayOfTravel(depAllRoutes, parseInt(dayOfTravel)),
            filterByDayOfTravel(destAllRoutes, parseInt(dayOfTravel)),
            parseInt(minWaitTime),
            parseInt(maxWaitTime)
        );

        res.json(result);
    } catch (error) {
        console.error(error);
        res.json({ error: 'An error occurred' });
    }
});

app.listen(port, () => {
    console.log('Server running at http://localhost:3000');
});
