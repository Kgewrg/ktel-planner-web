const citiesResponse = await fetch('ktel-planner-web/citiesDB.json');
const citiesData = await citiesResponse.json();

function getCityInfo(cityName) {
    for (const county of Object.values(citiesData)) {
        const index = county.indexOf(cityName);
        if (index !== -1) {
            return [county[0], county[index - 1]];
        }
    }
    return null;
}

async function fetchHtml(url) {
    const response = await fetch(url);
    return response.text();
}

function getIteniaryData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const routeRows = doc.querySelectorAll('tr.routerow');
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

document.getElementById('searchBtn').addEventListener('click', async () => {
    const departureCity = document.getElementById('departure').value;
    const destinationCity = document.getElementById('destination').value;
    const dayOfTravel = document.getElementById('dayOfTravel').value;
    const minWaitTime = document.getElementById('minWaitTime').value;
    const maxWaitTime = document.getElementById('maxWaitTime').value;

    const output = document.getElementById('output');
    output.innerHTML = 'Loading...';

    try {
        const depCityCodes = getCityInfo(departureCity);
        if (!depCityCodes) {
            output.innerHTML = 'Δεν βρέθηκε η πόλη αναχώρησης';
            return;
        }

        const destCityCodes = getCityInfo(destinationCity);
        if (!destCityCodes) {
            output.innerHTML = 'Δεν βρέθηκε η πόλη προορισμού';
            return;
        }

        const depHtml = await fetchHtml(`https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid=${depCityCodes[0]}&print=1&from=${depCityCodes[1]}&to=0`);
        const depAllRoutes = getIteniaryData(depHtml);

        const destHtml = await fetchHtml(`https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid=${destCityCodes[0]}&print=1&from=0&to=${destCityCodes[1]}`);
        const destAllRoutes = getIteniaryData(destHtml);

        const result = findMatchingRoutes(
            filterByDayOfTravel(depAllRoutes, parseInt(dayOfTravel)),
            filterByDayOfTravel(destAllRoutes, parseInt(dayOfTravel)),
            parseInt(minWaitTime),
            parseInt(maxWaitTime)
        );

        if (result.length === 0) {
            output.innerHTML = 'Δεν βρέθηκαν διαδρομές';
        } else {
            let html = '<div class="results">';
            for (const route of result) {
                html += `
                    <div class="route-card">
                                <div class="trip">🚌 Αναχώριση: ${route[0]} ➣ Άφιξη: ${route[3]} </div>
                                <div class="wait">⏳ Χρόνος αναμονής: <span class="wait-time">(${route[4]} λεπτά)</span></div>
                                <div class="wait"> Περίοδος αναμονής: ${route[1]} με ${route[2]} </div>
                            </div>
                `;
            }
            html += '</div>';
            output.innerHTML = html;
        }
    } catch (e) {
        output.innerHTML = 'Error: ' + e.message;
    }
});
