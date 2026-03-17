// const fs = require('fs');
// const path = require('path');
import { JSDOM } from 'jsdom';
import { get } from 'https';


async function getCityInfo(cityName) {

    const response = await fetch('./citiesDB.json'); 
    
    const data = await response.json();

    // const citiesData = JSON.parse(data, 'utf-8');


    // const citiesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'citiesDB.json'), 'utf-8'));
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
        console.log(html);
        const depHtml = await fetchHtml(html);
        const dom = new JSDOM(depHtml);
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
        
        // console.log(routes);
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
    return results;
}

function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}



console.log
// input: [departure Location, destination Location, minTimeWait, maxTimeWay, dayOfTravel]
// ["Αξιούπολη", "Σέρρες", 10, 60, 3]
const departureCity = "Αξιούπολη";
const destinationCity = "Σέρρες";
const minWaitTime = 10;
const maxWaitTime = 60;
// 1 Δευτέρα, 2 Τρίτη , 3 Τετάρτη, 4 Πέμπτη, 5 Παρασκεύη, 6 Σάββατο, 7 Κυριακή
const dayOfTravel = 6;

console.log("\n START \n");
const depCityCodes = await getCityInfo(departureCity);
console.log(depCityCodes);
const depAllRoutes = await getIteniaryData(`https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid=${depCityCodes[0]}&print=1&from=${depCityCodes[1]}&to=0`);

const destCityCodes = await getCityInfo(destinationCity);
const destAllRoutes = await getIteniaryData(`https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid=${depCityCodes[0]}&print=1&from=0&to=${depCityCodes[1]}`);



console.log(findMatchingRoutes(filterByDayOfTravel(depAllRoutes, dayOfTravel), filterByDayOfTravel(destAllRoutes, dayOfTravel), minWaitTime, maxWaitTime));
// (async () => {
// })();


