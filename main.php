

<?php
require 'vendor/autoload.php';

function getTimeData($crawler){
    // find the table row that contains the time and day data
    $timetable = $crawler->filter('.routerow')->each(function ($node) {
       return explode(" ", $node->text());
    });

    # strip unesecaray data from each row
    for ($i = 0; $i < count($timetable); $i++) {
        $row = $timetable[$i];
        $timetable[$i] = [$row[0], $row[1], $row[3]];
    }
    return $timetable;
}



function keepActiveDays(array $timetable, int $day){
    # Returns a smaller array that containts only the travel iteniaries that run on  $day
    # $day = [1, 7]

    $filterredTimetable = [];
    for ($i = 0; $i < count($timetable); $i++) {
        if (str_contains($timetable[$i][1], $day)){
            $filterredTimetable[] = $timetable[$i];
        }
    }

    return $filterredTimetable;


}


function calcIteniaries(array $departureTimes, array $destinationTimes, int $minWaitTime, int  $maxWaitTime){
    
    $resultPlans = [];
    for ($i = 0; $i < count($departureTimes); $i++){
        $midArrrvingTime = strtotime($departureTimes[$i][2]);
        for ($j = 0; $j < count($destinationTimes); $j++){
            $midDepartingTime = strtotime($destinationTimes[$j][0]);

            // dont calculate times that are not feasable 
            // (mid departure bus leaving before mid arriving bus arriving)
            if ($midArrrvingTime > $midDepartingTime){ continue;}


            // calculate wait minutes
            $waitMinutes = calcWaitMinutes($midArrrvingTime, $midDepartingTime);
            
            if ( $waitMinutes < $minWaitTime || $waitMinutes > $maxWaitTime){ continue;}
            
            // echo $departureTimes[$i][2] . " " . $destinationTimes[$j][0] . " " .  $waitMinute . "\n";
            
            $resultPlans[] = [$departureTimes[$i][0], $departureTimes[$i][2], $destinationTimes[$j][0], $destinationTimes[$j][2], $waitMinutes];
        }
    }
    return $resultPlans;
}




function calcWaitMinutes(int $midArrrvingTime, int $midDepartingTime){

    $waitSeconds = $midDepartingTime - $midArrrvingTime; 
    return $waitSeconds / 60;

}

function getCityCodes(string $cityName){
    // returns the lsid and cityID
    // output: [lsid, cityID]
    

    $jsonString = file_get_contents('citiesDB.json');

    $data = json_decode($jsonString, false);


    foreach ($data as $county => $citiesArray) {
        $index = array_search($cityName, $citiesArray);
        if ($index !== false){
            return [$citiesArray[0], $citiesArray[$index-1]];
        }
    }
    return [-1, -1];
}








// input: [departure Location, destination Location, minTimeWait, maxTimeWay, dayOfTravel]
// ["Αξιούπολη", "Σέρρες", 10, 60, 3]
$departureCity = "Αξιούπολη";
$destinationCity = "Σέρρες";
$minWaitTime = 10;
$maxWaitTime = 60;
// 1 Δευτέρα, 2 Τρίτη , 3 Τετάρτη, 4 Πέμπτη, 5 Παρασκεύη, 6 Σάββατο, 7 Κυριακή
$dayOfTravel = 6;


// return: arrayof (plan startTime, mid arrivalTime, mid departureTime, plan endtime, mid Wait Time)
// ...
// [19.05, 20.05, 21.00, 23.00, 55]
// ...

$client = new Symfony\Component\BrowserKit\HttpBrowser();

$depCityCodes = getCityCodes($departureCity);
$depCrawler = $client->request('GET', 'https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid='. $depCityCodes[0] . '&print=1&from='. $depCityCodes[1] .'&to=0');
$depTimes = getTimeData($depCrawler);

$destCityCodes = getCityCodes($destinationCity);
$destCrawler = $client->request('GET', 'https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid='. $destCityCodes[0] . '&print=1&from=0&to='. $destCityCodes[1] .'');
$destTimes = getTimeData($destCrawler);

$itineraries = calcIteniaries(keepActiveDays($depTimes, $dayOfTravel), keepActiveDays($destTimes, $dayOfTravel), $minWaitTime, $maxWaitTime);
print_r($itineraries);


// print_r($depTimes);
// print_r($destTimes);




// $depPage = file_get_contents('departure.html');
// $depCrawler = new Crawler($depPage);
// $depTimes = getTimeData($depCrawler);


// $destPage = file_get_contents('destination.html');
// $destCrawler = new Crawler($destPage);
// $destTimes = getTimeData($destCrawler);


// $cityCodes = getCityCodes($destinationCity);
// print_r($cityCodes); 








// print_r($destTimes);

// echo '' . $depTimes[3][2] . ' ' . $destTimes[3][2]. "\n"; 
// echo '' . (calcWaitMinutes($depTimes[3][2], $destTimes[3][2]) . "\n"); 
// echo '' . (calcWaitMinutes($destTimes[3][2], $depTimes[3][2]) . "\n"); 


?>

