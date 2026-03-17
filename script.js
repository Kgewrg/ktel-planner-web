
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
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    const response = await fetch(proxyUrl);
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


const citiesData = {
    "Πέλλα": [
        "29",
        "https://ktelmacedonia.gr/gr/routes/tid=29",
        "71",
        "Αριδαία",
        "42",
        "Γιαννιτσά",
        "72",
        "Έδεσσα",
        "73",
        "Κρύα Βρύση",
        "69",
        "Παλιά Πέλλα",
        "70",
        "Σκύδρα"
    ],
    "Ευρυτανία": [
        "35",
        "https://ktelmacedonia.gr/gr/routes/tid=35",
        "44",
        "Λαμία"
    ],
    "Λάρισα": [
        "24",
        "https://ktelmacedonia.gr/gr/routes/tid=24",
        "201",
        "Ελασσόνα",
        "34",
        "Λάρισα"
    ],
    "Λακωνία": [
        "98",
        "https://ktelmacedonia.gr/gr/routes/tid=98",
        "228",
        "Σπάρτη"
    ],
    "Ηράκλειο": [
        "13",
        "https://ktelmacedonia.gr/gr/routes/tid=13",
        "29",
        "Ηράκλειο"
    ],
    "Έβρος": [
        "8",
        "https://ktelmacedonia.gr/gr/routes/tid=8",
        "40",
        "Αλεξανδρούπολη",
        "92",
        "Διδυμότειχο",
        "93",
        "Ορεστιάδα",
        "94",
        "Προβατώνας",
        "91",
        "Σουφλί",
        "90",
        "Φέρες"
    ],
    "Χαλκιδική": [
        "-"
    ],
    "Σέρρες": [
        "33",
        "https://ktelmacedonia.gr/gr/routes/tid=33",
        "62",
        "Ηράκλεια",
        "59",
        "Κορμίστα, Παγγαίο",
        "60",
        "Μαυροθάλασσα",
        "61",
        "Νιγρίτα",
        "58",
        "Ροδολίβος",
        "43",
        "Σέρρες",
        "63",
        "Σιδηρόκαστρο"
    ],
    "Κοζάνη": [
        "22",
        "https://ktelmacedonia.gr/gr/routes/tid=22",
        "27",
        "Κοζάνη",
        "48",
        "Πτολεμαΐδα"
    ],
    "Ημαθία": [
        "12",
        "https://ktelmacedonia.gr/gr/routes/tid=12",
        "47",
        "Βέροια",
        "64",
        "Νάουσα"
    ],
    "Φθιώτιδα": [
        "35",
        "https://ktelmacedonia.gr/gr/routes/tid=35",
        "44",
        "Λαμία"
    ],
    "Αχαΐα": [
        "5",
        "https://ktelmacedonia.gr/gr/routes/tid=5",
        "32",
        "Πάτρα"
    ],
    "Φλώρινα": [
        "36",
        "https://ktelmacedonia.gr/gr/routes/tid=36",
        "54",
        "Αμύνταιο",
        "26",
        "Φλώρινα"
    ],
    "Πρέβεζα": [
        "31",
        "https://ktelmacedonia.gr/gr/routes/tid=31",
        "235",
        "Πάργα",
        "14",
        "Πρέβεζα",
        "234",
        "Φιλιππιάδα"
    ],
    "Εύβοια": [
        "9",
        "https://ktelmacedonia.gr/gr/routes/tid=9",
        "99",
        "Αιδηψός",
        "214",
        "Αλιβέρι",
        "16",
        "Χαλκίδα"
    ],
    "Γρεβενά": [
        "6",
        "https://ktelmacedonia.gr/gr/routes/tid=6",
        "25",
        "Γρεβενά"
    ],
    "Αθήνα": [
        "4",
        "https://ktelmacedonia.gr/gr/routes/tid=4",
        "45",
        "Αθήνα (Κηφισός)",
        "100",
        "Αθήνα (Π.Άρεως)",
        "101",
        "Αθήνα (Πειραιάς)"
    ],
    "Ροδόπη": [
        "32",
        "https://ktelmacedonia.gr/gr/routes/tid=32",
        "13",
        "Κομοτηνή"
    ],
    "Κόρινθος": [
        "23",
        "https://ktelmacedonia.gr/gr/routes/tid=23",
        "51",
        "Ισθμός",
        "53",
        "Κιάτο",
        "37",
        "Κόρινθος"
    ],
    "Χανιά": [
        "39",
        "https://ktelmacedonia.gr/gr/routes/tid=39",
        "30",
        "Χανιά"
    ],
    "Λέσβος": [
        "96",
        "https://ktelmacedonia.gr/gr/routes/tid=96",
        "233",
        "Λήμνος",
        "219",
        "Μυτιλήνη"
    ],
    "Αρκαδία": [
        "2",
        "https://ktelmacedonia.gr/gr/routes/tid=2",
        "36",
        "Τρίπολη"
    ],
    "Καστοριά": [
        "19",
        "https://ktelmacedonia.gr/gr/routes/tid=19",
        "19",
        "Καστοριά"
    ],
    "Ζάκυνθος": [
        "10",
        "https://ktelmacedonia.gr/gr/routes/tid=10",
        "21",
        "Ζάκυνθος"
    ],
    "Δράμα": [
        "7",
        "https://ktelmacedonia.gr/gr/routes/tid=7",
        "24",
        "Δράμα"
    ],
    "Λευκάδα": [
        "25",
        "https://ktelmacedonia.gr/gr/routes/tid=25",
        "22",
        "Λευκάδα"
    ],
    "Βοιωτία": [
        "41",
        "https://ktelmacedonia.gr/gr/routes/tid=41",
        "107",
        "Θήβα"
    ],
    "Λασίθιο": [
        "13",
        "https://ktelmacedonia.gr/gr/routes/tid=13",
        "29",
        "Ηράκλειο"
    ],
    "Ρέθυμνο": [
        "39",
        "https://ktelmacedonia.gr/gr/routes/tid=39",
        "30",
        "Χανιά"
    ],
    "Μαγνησία": [
        "26",
        "https://ktelmacedonia.gr/gr/routes/tid=26",
        "23",
        "Βόλος"
    ],
    "Αργολίδα": [
        "97",
        "https://ktelmacedonia.gr/gr/routes/tid=97",
        "227",
        "Άργος",
        "226",
        "Ναύπλιο"
    ],
    "Καβάλα": [
        "17",
        "https://ktelmacedonia.gr/gr/routes/tid=17",
        "39",
        "Καβάλα"
    ],
    "Ηλεία": [
        "11",
        "https://ktelmacedonia.gr/gr/routes/tid=11",
        "88",
        "Αμαλιάδα",
        "89",
        "Ανδραβίδα",
        "84",
        "Βάρδα",
        "86",
        "Γαστούνη",
        "85",
        "Λεχαινά",
        "95",
        "Νέα Μανωλάδα",
        "17",
        "Πύργος",
        "87",
        "Σαββάλια"
    ],
    "Καρδίτσα": [
        "18",
        "https://ktelmacedonia.gr/gr/routes/tid=18",
        "12",
        "Καρδίτσα"
    ],
    "Άρτα": [
        "3",
        "https://ktelmacedonia.gr/gr/routes/tid=3",
        "8",
        "Άρτα "
    ],
    "Άγιο όρος": [
        "-"
    ],
    "Θεσσαλονίκη": [
        "14",
        "https://ktelmacedonia.gr/gr/routes/tid=14",
        "183",
        "Αδάμ",
        "174",
        "Ασπροβάλτα",
        "180",
        "Βρασνά",
        "182",
        "Ζαγκλιβέρι",
        "161",
        "Θεσσαλονίκη",
        "184",
        "Καλαμωτό",
        "176",
        "Νέα Απολλωνία",
        "181",
        "Ολυμπιάδα",
        "185",
        "Πετροκέρασα",
        "178",
        "Ρεντίνα",
        "179",
        "Σταυρός"
    ],
    "Ξάνθη": [
        "28",
        "https://ktelmacedonia.gr/gr/routes/tid=28",
        "35",
        "Ξάνθη"
    ],
    "Κιλκίς": [
        "21",
        "https://ktelmacedonia.gr/gr/routes/tid=21",
        "76",
        "Άγιος Πέτρος",
        "57",
        "Αξιούπολη",
        "56",
        "Γουμένισσα",
        "77",
        "Εύρωπος ",
        "1",
        "Κιλκίς",
        "55",
        "Πολύκαστρο",
        "78",
        "Τούμπα"
    ],
    "Μεσσηνία": [
        "27",
        "https://ktelmacedonia.gr/gr/routes/tid=27",
        "18",
        "Καλαμάτα"
    ],
    "Θεσπρωτία": [
        "15",
        "https://ktelmacedonia.gr/gr/routes/tid=15",
        "20",
        "Ηγουμενίτσα"
    ],
    "Τρίκαλα": [
        "34",
        "https://ktelmacedonia.gr/gr/routes/tid=34",
        "98",
        "Καλαμπάκα",
        "33",
        "Τρίκαλα"
    ],
    "Κέρκυρα": [
        "20",
        "https://ktelmacedonia.gr/gr/routes/tid=20",
        "15",
        "Κέρκυρα"
    ],
    "Πιερία": [
        "30",
        "https://ktelmacedonia.gr/gr/routes/tid=30",
        "80",
        "Αιγίνιο",
        "41",
        "Κατερίνη",
        "81",
        "Κολινδρός",
        "194",
        "Λεπτοκαρυά",
        "83",
        "Λιτόχωρο",
        "82",
        "Μακρύγιαλος",
        "79",
        "Μεθώνη",
        "196",
        "Ν.Πόρροι",
        "195",
        "Πλαταμώνας"
    ],
    "Ιωάννινα": [
        "16",
        "https://ktelmacedonia.gr/gr/routes/tid=16",
        "10",
        "Ιωάννινα"
    ],
    "Φωκίδα": [
        "37",
        "https://ktelmacedonia.gr/gr/routes/tid=37",
        "31",
        "Άμφισσα",
        "222",
        "Γαλαξίδι",
        "221",
        "Δελφοί",
        "220",
        "Ιτέα"
    ],
    "Αιτωλοακαρνανία": [
        "1",
        "https://ktelmacedonia.gr/gr/routes/tid=1",
        "106",
        "Αγρίνιο",
        "38",
        "Μεσολόγγι"
    ]
};