

<?php
require 'vendor/autoload.php';
use Goutte\Client;
use Symfony\Component\DomCrawler\Crawler;



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



// $client = new Client();
// $crawler = $client->request('GET', 'https://ktelmacedonia.gr/gr/routes/ajaxroutes/modonly=1&lsid=21&print=1&from=0&to=57');

$depPage = file_get_contents('departure.html');
$depCrawler = new Crawler($depPage);

$depTimes = getTimeData($depCrawler);

$destPage = file_get_contents('destination.html');
$destCrawler = new Crawler($destPage);

$destTimes = getTimeData($destCrawler);




print_r($depTimes);
print_r($destTimes);



?>

