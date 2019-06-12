// --- Imports 
var Readline = require('readline');  // --- Readline Module... to read files and stdin...
let Utils = require('utils');        // --- 
let DTW = require('dtw');                

// --- Globals
const infinity = Number.MAX_SAFE_INTEGER;
let trainingSet = [];
let testSet = [];
let lock = 0;   // --- As we are dealing with 2 files and here files are read in paralel, we need to wait till both files are completely stored in memory to start doing some real work

// --- Instantiates new line reader (trainig file)
var trainingFileReader = require('readline').createInterface({
    input: require('fs').createReadStream('treino.txt')
}); 

// --- Instantiates new line reader (test file)
var testFileReader = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
  
// --- On read a line from the training file
trainingFileReader.on('line', function(line){

    let signal = {};
    let split = line.split(" ");
    signal.label = split[0];
    signal.values = [];
  
    for(i=1; i<split.length; i++)
        signal.values.push(parseFloat(split[i]));    

    trainingSet.push(signal);
    })
// --- When file parsing is finished
.on('close', function () {     
    console.log("--- Parsing training file finished");    
    lock++;
    if(lock == 2) solve();    
});
  
// --- On read a line from the test file
testFileReader.on('line', function(line){

    let signal = {};
    let split = line.split(" ");
    signal.label = split[0];
    signal.values = [];
  
    for(i=1;i<split.length;i++)
        signal.values.push(parseFloat(split[i]));    

    testSet.push(signal);
    })
// --- When file parsing is finished
.on('close', function () {     
    console.log("--- Parsing test file finished");    
    lock++;
    if(lock == 2) solve();
});

// --- Find's next-neighbour for many cases


function solve(){
    console.log("\n    Solving DTW    . . . . .");

    // --- Creates object to store results
    let result = {
        success: 0,
        errors: 0,
        rate: 0
    };

    // --- Aux Variables
    let matches = [];
    let startTime = Date.now();
    let lastTestFinishTime = Date.now();    

    // --- For each entry in test set
    for(let i=0; i<testSet.length; i++){
        
        let actualTest = testSet[i];
        
        // --- Aux variables
        let match = {};
        let minDtw = infinity;
        let actualBestTraining;        
              
        // --- Search every entry within the training set for the best match
        for(j=0; j<trainingSet.length; j++){     

            // --- Get one training array
            let actualTraining = trainingSet[j];
                       
            // --- Performs DTW Calculation
            let dtw = infinity;            
            
            dtw = DTW.DTW(actualTest.values, actualTraining.values);
            
                // --- Store min value of dtw found
                if(dtw <= minDtw) {
                    actualBestTraining = actualTraining;
                    minDtw = dtw;
                }
        }
      
        // --- Stores results
        let auxTime = Date.now();
        match.actualTest = actualTest;
        match.bestMatch = actualBestTraining;
        match.searchTime = auxTime - lastTestFinishTime;               
        match.dtw = minDtw; 
        matches.push(match);       
        lastTestFinishTime = auxTime; 
        
        // --- Counts errors an success
        if(actualTest.label == actualBestTraining.label) 
            result.success++; 
        else 
            result.errors++;
    }
    
    let finishTime = Date.now();    

    result.executionTime = finishTime-startTime;
    result.rate = result.success/(result.success+result.errors);    
    result.matches = matches;
    console.log("Time",(result.executionTime)/1000,"seconds");
    console.log("Rate",result.rate*100,"%"); 
    console.log("Results saved in the file"); 

    Utils.saveToFile(result, "Result");
}