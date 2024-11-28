import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import puppeteer from 'puppeteer';
import qs from 'qs';


// Set base URL for API requests
const apiBaseUrl = 'https://payment.ivacbd.com';


const timeSlotUrl = `${apiBaseUrl}/get_payment_options_v2`;
const payNowUrl = `${apiBaseUrl}/slot_pay_now`;


// data info variables
var expected_date = '2024-12-01';

//Date Release time
const targetTime = '12:58:30'; // Target time in HH:mm:ss format
const FiveStepTime = '12:50:00'; //

    let application = [
        { web_file: "BGDDW2A86B24", applicant_name: "FOYEZ AHMED" },
        { web_file: "BGDDW2A82824", applicant_name: "NEJAM UDDIN" },
        { web_file: "BGDDW2AC9F24", applicant_name: "SUPPRIYA BISWAS" },

];   

var mobile="01616608278";
var email = "pakkna@gmail.com";
let ReceivedOTP = "639159";

var MainCenterId = 1; // Dhaka 1 , Chittagong 2, Rajshahi 3,Sylhet 4, KHULNA 5
var VisaCenterId = 17;  //DHaka 17, JESSORE 12, KHULNA 19
var VisaTypeId = 13; // MEDICAL VISA 13 // ENTRY VISA 6 // TOURIST VISA 3

// Set CSRF token  &&  API key
let csrfToken, apiKey;

// funtion processing Variable;

let isSlotTimeRequestStop = false;
let isFinalPayNowRequestStop = false;
let isStepFiveCompleted = false;

let batchRequestTimeoutId; // set timeout id;
const batchProcessTimeouts = []; // Array to store timeout IDs

// Store abort controllers for active requests
let abortControllers = [];

let validationTimeoutId = null;
let checkGetTimeSlot = false;
let selected_slot = {
      "id": 157379,
      "ivac_id": 17,
      "visa_type": 13,
      "hour": 10,
      "date": "2024-12-01",
      "availableSlot": 300,
      "time_display": "10:00 - 10:59"
    };
// Sample array of objects
const MainCenterlist = [
    { id: 1, c_name: "Dhaka", prefix: "D" },
    { id: 2, c_name: "Chittagong", prefix: "C" },
    { id: 3, c_name: "Rajshahi", prefix: "R" },
    { id: 4, c_name: "Sylhet", prefix: "S" },
    { id: 5, c_name: "Khulna", prefix: "K" }
];
const VisaCenterList = [
    { id: 12, center_info_id: 1, ivac_name: "IVAC, JESSORE", prefix: "D", visa_fee: "800.00", charge: "3", new_visa_fee: "800.00", old_visa_fee: "800.00", app_key: "IVACJESSORE" },
    { id: 17, center_info_id: 1, ivac_name: "IVAC, Dhaka (JFP)", prefix: "D", visa_fee: "800.00", charge: "3", new_visa_fee: "800.00", old_visa_fee: "800.00", app_key: "IVACJFP" },
    { id: 18, center_info_id: 3, ivac_name: "IVAC, RAJSHAHI", prefix: "R", visa_fee: "800.00", charge: "3", new_visa_fee: "800.00", old_visa_fee: "800.00", app_key: "IVACRAJSHAHI" },
    { id: 19, center_info_id: 5, ivac_name: "IVAC, KHULNA", prefix: "K", visa_fee: "800.00", charge: "3", new_visa_fee: "800.00", old_visa_fee: "800.00", app_key: "IVACKHULNA" },
    { id: 20, center_info_id: 7, ivac_name: "IVAC, SYLHET", prefix: "S", visa_fee: "800.00", charge: "3", new_visa_fee: "800.00", old_visa_fee: "800.00", app_key: "IVACSYLHET" },
    { id: 21, center_info_id: 9, ivac_name: "IVAC, CHITTAGONG", prefix: "C", visa_fee: "800.00", charge: "3", new_visa_fee: "800.00", old_visa_fee: "800.00", app_key: "IVACCHITTAGONG" },
    { id: 22, center_info_id: 11, ivac_name: "IVAC, BARISAL", prefix: "B", visa_fee: "800.00", charge: "3", new_visa_fee: "800.00", old_visa_fee: "800.00", app_key: "IVACBARISAL" },
    { id: 23, center_info_id: 13, ivac_name: "IVAC, COMILLA", prefix: "M", visa_fee: "800.00", charge: "3", new_visa_fee: "800.00", old_visa_fee: "800.00", app_key: "IVACCOMILLA" }
];
// VIsa Type array of objects}
const VisaTypelist = [
    { id: 3, type_name: "TOURIST VISA", order: 1, is_active: 1 },
    { id: 13, type_name: "MEDICAL/MEDICAL ATTENDANT VISA", order: 2, is_active: 1},
    { id: 2, type_name: "STUDENT VISA", order: 6, is_active: 1 },
    { id: 6, type_name: "ENTRY VISA", order: 5, is_active: 1}
];
                

let filesInfo = {
    payment:[]
}

// Loop through each item in the application array, add an extra key, and push it to the payment array
application.forEach(item => {
    // Create a copy of the item and add an extra key, e.g., 'status'
    let newItem = {
            web_id: item.web_file,
            web_id_repeat: item.web_file,
            name: item.applicant_name,
            captcha: "",
            passport: "",
            phone: mobile,
            email: email,
            amount: "800.00",
            amountChangeData: { allow_old_amount_until_new_date: 2, max_notification_count: 0, old_visa_fees: "800.00", notice: false, new_visa_fee: "800.00" },
            center: getObjectByName(MainCenterlist, MainCenterId), // Dhaka 1 , KHULNA 5
            is_open: "true",
            ivac:  getObjectByName(VisaCenterList, VisaCenterId), //DHaka 17, kHULNA 19
            visa_type: getObjectByName(VisaTypelist, VisaTypeId), // MEDICAL VISA 13 // ENTRY VISA 6
            confirm_tos: "true",
        };
    
    filesInfo.payment.push(newItem);
});
    
filesInfo.payment[0].appointment_time = expected_date;
filesInfo.payment[0].otp = ReceivedOTP;


//Visa Card Payment Gateway
//let selected_payment = { name: "VISA", slug: "visacard", grand_total: application.length * 800 + application.length*24, link: "https://securepay.sslcommerz.com/gwprocess/v4/image/gw1/visa.png" } 

//Baksh Payment Gateway
let selected_payment={  name: "Bkash", slug: "bkash", grand_total: application.length * 800 + application.length*24, link: "https://securepay.sslcommerz.com/gwprocess/v4/image/gw1/bkash.png" };



//Headers for Axios request
const axiosConfig = {
    headers: {
        'Connection': 'keep-alive',
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8;",
        'Priority': 'u=0',
    },
    // timeout: 30000,
     withCredentials: true,
     
};

const validationHeader = {
    headers: {
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://payment.ivacbd.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
        'Priority': 'u=0',
        'TE':'trailers'
    },
};
  
// Array of User-Agent strings for Windows and Linux
const userAgents = [
    // Windows User-Agents
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/101',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Firefox/96',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/91',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Trident/7.0; rv:11.0) like Gecko',
    
    // Linux User-Agents
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:90.0) Firefox/90',
    'Mozilla/5.0 (X11; Linux x86_64) Chrome/92',
    'Mozilla/5.0 (X11; Linux i686; rv:89.0) Firefox/89',
    'Mozilla/5.0 (X11; Fedora; Linux x86_64) Chrome/93',

     // Additional Cross-Platform Options
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/100.0',
];


let selectedSlotKey=filesInfo.payment[0].web_id+'_'+expected_date+'_slot';
let cookiesKey = filesInfo.payment[0].web_id + '_'+expected_date + '_cookies';
let validationKey = filesInfo.payment[0].web_id + '_' + expected_date + '_stepVerify';
let StepFiveCheckKey = filesInfo.payment[0].web_id + '_' + expected_date + '_stepFive';
let FinalMsgKey = filesInfo.payment[0].web_id + '_' + expected_date + '_finalResponse';

let checkSelectedSlot=getItem(selectedSlotKey);
let getCookies = getItem(cookiesKey);
let isvalidated = getItem(validationKey);
isStepFiveCompleted= getItem(StepFiveCheckKey); 


if(isStepFiveCompleted!==undefined){
    isStepFiveCompleted=true;
}

if(checkSelectedSlot!==undefined){
    selected_slot=checkSelectedSlot;
    checkGetTimeSlot = true; 
}


// Function to get an object by name
function getObjectByName(objectArray,id) {
    return objectArray.find(obj => obj.id === id);
}

function getRandomDelay() {
    const randomDelay = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
    return randomDelay;
}


// Function to get a random User-Agent
function getRandomUserAgent() {
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
}

  
// Function to handle PayNow Payment Request
const FinalPayNowV2Request = async()=>{
    if (isFinalPayNowRequestStop) {
        updateStatusMessage('timeSlotMsg', 'Pay Now Request is stopped successfully');
        return;
    }
    
    const payNowSubmitData =qs.stringify({
        _token: csrfToken,
        apiKey: apiKey,
        action:'payInvoice',
        info : filesInfo.payment,
        selected_payment : selected_payment,
        selected_slot : selected_slot,
    });

    axiosConfig.headers['User-Agent'] = getRandomUserAgent();

    // Create and store a new AbortController for this request
        const controller = new AbortController();
        const { signal } = controller;
        abortControllers.push(controller);

    try {

        const response = await axios.post(payNowUrl, payNowSubmitData, {...axiosConfig,signal});

        const resp = response.data;

        updateStatusMessage('finalPayMSG', JSON.stringify(resp, null, 2), '\x1b[32m%s\x1b[0m');
        
        if (resp.status === "FAIL") {
            const error_reason = resp?.errors?.toString() ?? "Pay Now Data response error.";

            if (error_reason.includes("Available slot is less than zero")) {
                updateStatusMessage('finalPayMSG', error_reason);
                batchRequestTimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);
            } else {
                    
                isFinalPayNowRequestStop = true;
                batchProcessTimeouts.forEach(clearTimeout);

                    // Clear and abort all remaining requests
                abortControllers.forEach((ctrl) => ctrl.abort());
                abortControllers = [];
                    
                updateStatusMessage('finalPayMSG', error_reason);
            }

        } else if (resp.status !== "FAIL") {

            setItem(FinalMsgKey, resp);

            if (resp.status=="OK" && resp.url !== "") {
                isFinalPayNowRequestStop = true;
                batchProcessTimeouts.forEach(clearTimeout);

                 // Clear and abort all remaining requests
                 abortControllers.forEach((ctrl) => ctrl.abort());
                 abortControllers = [];

                if (resp.order_id !== '') {
                    updateStatusMessage('finalPayMSG', `Payment OrderId: ${resp.order_id} Found Successfully`, '\x1b[32m%s\x1b[0m');
                }

                openLink(resp.url + selected_payment.slug);
                updateStatusMessage('finalPayMSG', 'PayNow Link Found...');
            } else {
                console.warn('Payment gateway not running right now. Retrying...');
                batchRequestTimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);
            }

        } else {
            console.warn('Response data invalid! Resending request...');
            batchRequestTimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
            batchProcessTimeouts.push(batchRequestTimeoutId);
        }
        
    } catch (error) {

        if (error.response) {

            const statusCode = error.response.status;

            if (statusCode === 504 || statusCode === 502) {  // Gateway timeout
                updateStatusMessage('finalPayMSG', `${statusCode} Gateway timeout! Resending Request`);
                batchRequestTimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);

            } else if (statusCode === 500) {  
                updateStatusMessage('finalPayMSG', `${statusCode} Request Data Error! Check data.`);
            }else if (statusCode === 429) {  
                updateStatusMessage('finalPayMSG', `${statusCode} Request Rate Limit Excided.`);
                console.log("\n====== Request Rate Limit Excided . Please Change Your IP Then Press Enter ======\n");
                // Wait for user input to proceed

                 isFinalPayNowRequestStop = true;
                 batchProcessTimeouts.forEach(clearTimeout);
                 // Clear and abort all remaining requests
                 abortControllers.forEach((ctrl) => ctrl.abort());
                 abortControllers = [];

                await new Promise(resolve => process.stdin.once('data', resolve));

                isFinalPayNowRequestStop = false;
                batchedRequestsSend(FinalPayNowV2Request);

            }else if (statusCode === 403) {  // Forbidden
                updateStatusMessage('finalPayMSG', `${statusCode} Access forbidden! Check permissions.`);

                batchRequestTimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);
                
            } else {
                console.log(`Error ${statusCode}: ${error.message}`);
                updateStatusMessage('finalPayMSG', `Response Error Status ${error.message}`);
                batchRequestTimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);
            }
        } else {
            updateStatusMessage('finalPayMSG', `Response Error Status ${error.message}`);
        }
    }
}

// Function to handle slot time request with caching
const getDateTimeSlotRequest = async()=>{


    if (isSlotTimeRequestStop) {
        updateStatusMessage('timeSlotMsg', 'TIme Slot Request stoped Successfully');
        return;
    }else if (checkGetTimeSlot) {
        updateStatusMessage('timeSlotMsg','Slot Already Selected: '+selected_slot.time_display);
        return;
    }

    const timeSlotPostData = qs.stringify({
        _token: csrfToken,
        apiKey: apiKey,
        action: 'generateSlotTime',
        amount: '10.00',
        ivac_id: filesInfo.payment[0].ivac.id,
        visa_type: filesInfo.payment[0].visa_type.id,
        specific_date: expected_date,
        info: filesInfo.payment,
    });

    axiosConfig.headers['User-Agent'] = getRandomUserAgent();
    
    // Create and store a new AbortController for this request
        const controller = new AbortController();
        const { signal } = controller;
        abortControllers.push(controller);
       
    try {
        const response = await axios.post(timeSlotUrl, timeSlotPostData, {...axiosConfig,signal});

        const resp = response.data;


            if (resp.status=='OK' && resp.slot_times.length===0) {

                updateStatusMessage('timeSlotMsg', 'Time slot not available in this time.Resending...');

                batchRequestTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);

            }else if(resp.status=='OK' && resp.slot_times.length!==0){

                    updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                    
                    selected_slot = resp.slot_times[0];
                    filesInfo.payment[0].appointment_time = selected_slot.hour;
                    
                    isSlotTimeRequestStop = true;
                    checkGetTimeSlot=true;
                   // Clear and abort all remaining requests
                    abortControllers.forEach((ctrl) => ctrl.abort());
                    abortControllers = [];
                    batchProcessTimeouts.forEach(clearTimeout);
                
                    setItem(selectedSlotKey, selected_slot);
                
                    updateStatusMessage('timeSlotMsg', 'Sending final PayNow request....');
                
                    batchedRequestsSend(FinalPayNowV2Request);

            } else {
                updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                updateStatusMessage('timeSlotMsg', 'Time Slot is Empty! Resending Request...');

                batchRequestTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);
            }    

    } catch (error) {
       
        if (error.response) {
            const statusCode = error.response.status;

            if (statusCode === 504 || statusCode === 502) {  // Gateway timeout
                updateStatusMessage('timeSlotMsg', `${statusCode} Gateway timeout! Resending Request`);
                batchRequestTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);

            } else if (statusCode === 500) {  
                updateStatusMessage('timeSlotMsg', `${statusCode} Request Data Error! Check data.`);
                batchRequestTimeoutId = setTimeout(getDateTimeSlotRequest, 10000);
                batchProcessTimeouts.push(batchRequestTimeoutId);
            }else if (statusCode === 429) {  
                updateStatusMessage('timeSlotMsg', `${statusCode} Request Rate Limit Excided.`);
                console.log("\n====== Request Rate Limit Excided . Please Change Your IP Then Press Enter ======\n");
                // Wait for user input to proceed
                isSlotTimeRequestStop = true;
                batchProcessTimeouts.forEach(clearTimeout);
                await new Promise(resolve => process.stdin.once('data', resolve));

                batchedRequestsSend(getDateTimeSlotRequest);

            }else if (statusCode === 403) {  // Forbidden
                updateStatusMessage('timeSlotMsg', `${statusCode} Access forbidden! Check permissions.`);
                batchRequestTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);
            } else {
                console.log(`Error ${statusCode}: ${error.message}`);
                updateStatusMessage('timeSlotMsg', `Response Error Status ${error.message}`);
                batchRequestTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
                batchProcessTimeouts.push(batchRequestTimeoutId);
            }
        } else {
            updateStatusMessage('timeSlotMsg', `Response Error Status ${error.message}`);
        }

    }
}


const batchedRequestsSend = async (sendRequest)=>{
    
    const numberOfBatchedRequests = 5; // Total number of requests

    for (let i = 0; i < numberOfBatchedRequests; i++) {
        const delay = getRandomDelay; // Calculate the delay

        // console.log('Time slot batch Request sending:'+i);

        batchRequestTimeoutId = setTimeout(() => {
            sendRequest(i); // Call sendRequest with the current index
        }, delay);

        batchProcessTimeouts.push(batchRequestTimeoutId); // Store the timeout ID
    }
}

if (getCookies != undefined && getCookies) {
   
    apiKey = getCookies.apiKey;
    csrfToken = getCookies.apiKey;

    // Set cookies  in headers validation Headers
    validationHeader.headers['Cookie'] = getCookies.cookieHeader;
    validationHeader.headers['X-XSRF-TOKEN'] = getCookies.xsrf_token;

     // Set XSRF token in axios headers
    axiosConfig.headers['Cookie'] =getCookies.cookieHeader;
    axiosConfig.headers['X-XSRF-TOKEN'] = getCookies.xsrf_token;

    
    console.log("====== COOKIES & API KEY  RETRIEVED FROM STORAGE ======\n");

    if (isvalidated != undefined && isvalidated) {

        console.log("====== FILE 5 STEP ALREADY VALIDATED. START TO SCHEDULE ======\n");
          // Wait for user input to proceed
        //await new Promise(resolve => process.stdin.once('data', resolve));

        if (selected_slot!=="" && isStepFiveCompleted) {
           batchedRequestsSend(FinalPayNowV2Request);
        } else if (selected_slot == "" && isStepFiveCompleted) {
            batchedRequestsSend(getDateTimeSlotRequest);
        
        } else if (selected_slot !== "" && !isStepFiveCompleted) {
            scheduleRequestSetup(FiveStepTime);
           
        } else {
            batchedRequestsSend(StepFiveComplete);
        }
       
        
    } else {
        console.log("====== FILE 5 STEP NOT VALIDATED. START VALIDATION ======\n");
       
        //await new Promise(resolve => process.stdin.once('data', resolve));
        //FinalPayNowV2Request();
         validateApplication();
    }  

} else {

      //  start to get token and api key by Browser
    (async () => {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        const cookies_info = {};
        // Set a custom user agent
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36';
        await page.setUserAgent(userAgent);
       
        let errorMessages = ""; // Variable to store error messages
    
        console.log("====== STARTING To RETRIEVE API Key ======\n");
    
        while (true) {
            try {
                console.log("Step 1: Waiting for the server response...");
    
                // Navigate to the URL
                const response = await page.goto('https://payment.ivacbd.com/', { waitUntil: 'networkidle2'});
                console.log("Step 2: Server responded.\n");
    

                // Wait for AngularJS to be fully loaded
                await page.waitForSelector('[ng-app]', { timeout: 20000 });

                // Extract the apiKey from AngularJS scope
                const RetriveApiKey = await page.evaluate(() => {
                    return angular.element(document.body).scope().apiKey;
                });

                const cookies = await page.cookies();

                //console.log('Cookies:', cookies);
    
                if (RetriveApiKey) {
                    console.clear(); // Clear the console including any previous errors
                    console.log("====== STARTING To RETRIEVE API Key ======\n");
                    console.log(`Step 4: API Key : ${RetriveApiKey}\n`);
                    console.log("====== API KEY SUCCESSFULLY RETRIEVED ======");

                    apiKey=RetriveApiKey
                    csrfToken = RetriveApiKey;

                    // Function to extract specific cookie values
                    function extractCookies(cookiesArray, cookieNames) {

                        const extractedValues = {};
    
                            cookieNames.forEach(name => {
                                const cookie = cookiesArray.find(cookie => cookie.name === name);
                                    if (cookie) {
                                        extractedValues[name] = cookie.value;
                                    }
                            });
    
                        return extractedValues;
                    }

                    // Extracting XSRF-TOKEN and ivac_session values
                    const cookiesToExtract = ['XSRF-TOKEN', 'ivac_session'];
                    const extractedCookies = extractCookies(cookies, cookiesToExtract);
                      // Get all cookies for the current page
                    
                    if (cookiesToExtract.length > 0) {

                        console.log("\n====== CSRF TOKEN & SESSION SUCCESSFULLY RETRIEVED ======\n");
                       // console.log('Extracted XSRF-TOKEN:', extractedCookies['XSRF-TOKEN']);

                        // // Setting extracted cookies in header format
                         const cookieHeader =`XSRF-TOKEN=${extractedCookies['XSRF-TOKEN']}; ivac_session=${extractedCookies['ivac_session']}`;
                        
                        // Set cookies  in headers validation Headers
                        validationHeader.headers['Cookie'] = cookieHeader;
                        validationHeader.headers['X-XSRF-TOKEN'] = extractedCookies['XSRF-TOKEN'];

                         // Set XSRF token in axios headers
                        axiosConfig.headers['Cookie'] = cookieHeader;
                        axiosConfig.headers['X-XSRF-TOKEN'] =decodeURIComponent(extractedCookies['XSRF-TOKEN']);
                        
                        //set api key info in storage
                        cookies_info.apiKey = RetriveApiKey;
                        //set cookie info in storage
                        cookies_info.cookieHeader = cookieHeader;
                        //set xsrf token info in storage
                        cookies_info.xsrf_token = decodeURIComponent(extractedCookies['XSRF-TOKEN']);

                        setItem(cookiesKey, cookies_info);
                        
                        console.log("\n====== COOKIS SETUP SUCCESSFULLY ======\n");
                    } else {
                        throw new Error('Cookies not found.');
                    }
                    
                    //console.log('Extracted XSRF-TOKEN:', extractedCookies['XSRF-TOKEN']);

                    break; // Exit the loop once both values are retrieved
                } else {
                    throw new Error('API key not found.');
                }
                
    
            } catch (error) {
                errorMessages += `Attempt failed. Error: ${error.message}.\n`; // Append errors to errorMessages
                console.clear(); // Clear previous logs
                console.log(errorMessages); // Show accumulated error messages
                console.log("Retrying in 2 seconds...\n");
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 2 seconds before retrying
            }
        }
    
        // Close the browser after successful retrieval
        await browser.close();
    
        console.log("\n====== FILE 5 STEP NOT VALIDATED.PRESS ENTER START VALIDATION ======\n");
        // // Wait for user input to proceed
        // await new Promise(resolve => process.stdin.once('data', resolve));

        //console.log(validationHeader.headers);
        //console.log(axiosConfig.headers);

        validateApplication();

    })();

}

// Function to check the time and call sendOtpPostRequest if it's 10:00:01 AM BDT
async function scheduleRequestSetup(targetTime) {

    // Function to get current time in Bangladesh Time
    function getBangladeshTime() {
        const options = {
            timeZone: 'Asia/Dhaka', // Set to Bangladesh time zone
            hour12: false // Use 24-hour time format
        };
    
        // Get the current date in the specified timezone
        const date = new Date();
    
        // Get the time string formatted as HH:mm:ss
        return date.toLocaleTimeString('en-US', options);
    }

    // Convert targetTime to milliseconds for comparison
    function parseTimeString(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds, 0);
        return date.getTime();
    }

    const targetTimeMs = parseTimeString(targetTime);
    
    const interval = setInterval(async () => {
        const currentTime = getBangladeshTime();
        const currentTimeMs = parseTimeString(currentTime);
        console.log(`Current Time in BDT: ${currentTime}`);
        
        // Check if the current time is greater than or equal to the target time
        if (currentTimeMs >= targetTimeMs && isStepFiveCompleted && selected_slot=="") {

            clearInterval(interval); // Stop checking after the function is called

            console.log('\n STARTING REQUEST SENDING IN TIME\n');
            batchedRequestsSend(getDateTimeSlotRequest);
            
        }else if (currentTimeMs >= targetTimeMs && isStepFiveCompleted && selected_slot!==""){

            clearInterval(interval); // Stop checking after the function is called

            console.log('\n STARTING REQUEST SENDING IN TIME\n'); 
            batchedRequestsSend(FinalPayNowV2Request);
            
        } else if (currentTimeMs >= targetTimeMs && !isStepFiveCompleted) {

            clearInterval(interval); // Stop checking after the function is called

            console.log('\n STARTING FIVE STEP REQUEST SENDING IN TIME\n'); 
            batchedRequestsSend(StepFiveComplete);
        } else {
            console.clear();
            console.log(`Date Release Time Not Yet ... Current Time: ${currentTime}`);
        }
    }, 1000); // Check every second
}

async function validateApplication() {

    let web_file = filesInfo.payment[0].web_id;

    if (!web_file) {
        console.error('Invalid web_file value');
        return; // Exit if web_file is not valid
    }

    try {

        const response = await axios.get(`${apiBaseUrl}/payment/check-session/${web_file}`, validationHeader);

        const isPaymentComplete = response.data === 'true';

        if (!isPaymentComplete) {
            console.log('Payment Check Response:', response.data);
             updateStatusMessage('FileValidation', `File Verify Step 1 Completed successfully`);
             completeSteps(); // Ensure to await the completion of steps
        }
    } catch (error) {
        // Handle error
        updateStatusMessage('FileValidation', 'FileValidation Server error. Retrying...');
        validationTimeoutId = setTimeout(validateApplication, getRandomDelay); // Retry after 1 second
    }
}

async function completeSteps() {
    for (let step = 2; step <= 4; step++) {
        try {
            // Introduce a delay of 1000-1500 ms before each step
            await new Promise(resolve => setTimeout(resolve, getRandomDelay));

            const response = await axios.get(`${apiBaseUrl}/payment/check-step/${step}`, validationHeader);
            console.log('Payment Check Response:', response.data); // Log the full response for debugging
            
            if (response.data === false || response.data === 'false') {
                updateStatusMessage('FileValidation', `File Verify Step ${step} Completed successfully`);
                if (step === 4) {
                    setItem(validationKey, 1);
                    
                    if (selected_slot!=="" && isStepFiveCompleted) {
                        batchedRequestsSend(FinalPayNowV2Request);
                    }else{
                        scheduleRequestSetup(FiveStepTime);
                    }
                }
            } else {
                console.log(`Step ${step} failed. Response:`, response.data);
            }
        } catch (error) {
            updateStatusMessage('FileValidationStep', `File Verify Step ${step} Server Error. Retrying...`);
            step--; // Retry the current step
        }
    }
}

async function StepFiveComplete() {

        
        // Create and store a new AbortController for this request
        const controller = new AbortController();
        const { signal } = controller;
        abortControllers.push(controller);

        try {

            const response = await axios.get(`${apiBaseUrl}/payment/check-step/5`, {...validationHeader,signal});

            console.log('Validation Check Step 5 Response:', response.data);

            if (response.data === false || response.data === 'false') {

                isStepFiveCompleted = true;
                setItem(StepFiveCheckKey, true);

                // Clear and abort all remaining requests
                abortControllers.forEach((ctrl) => ctrl.abort());
                abortControllers = [];
                batchProcessTimeouts.forEach(clearTimeout);

                updateStatusMessage('StepFiveValidation', 'File Validation Step 5 Completed successfully', 'success');


                scheduleRequestSetup(targetTime);

            } else {
                updateStatusMessage('StepFiveValidation', `Step 5 failed. Response: ${response}`);
            }
        } catch (error) {
            
            if (error.response) {
            const statusCode = error.response.status;

                if (statusCode === 504 || statusCode === 502) {  // Gateway timeout
                    updateStatusMessage('StepFiveValidation', `${statusCode} Gateway timeout! Resending Request`);
                    batchRequestTimeoutId = setTimeout(StepFiveComplete, getRandomDelay);
                    batchProcessTimeouts.push(batchRequestTimeoutId);
                } else if (statusCode === 500) {  
                    updateStatusMessage('StepFiveValidation', `${statusCode} Request Data Error! Check data.`);
                }else if (statusCode === 429) {  
                    updateStatusMessage('StepFiveValidation', `${statusCode} Request Rate Limit Excided.`);
                    console.log("\n====== Request Rate Limit Excided . Please Change Your IP Then Press Enter ======\n");
                    // Wait for user input to proceed
                    batchProcessTimeouts.forEach(clearTimeout);
                    // Clear and abort all remaining requests
                    abortControllers.forEach((ctrl) => ctrl.abort());
                    abortControllers = [];

                    await new Promise(resolve => process.stdin.once('data', resolve));

                    batchedRequestsSend(StepFiveComplete);

                }else if (statusCode === 403) {  // Forbidden
                    updateStatusMessage('StepFiveValidation', `${statusCode} Access forbidden! Check permissions.`);
                    batchRequestTimeoutId = setTimeout(StepFiveComplete, getRandomDelay);
                    batchProcessTimeouts.push(batchRequestTimeoutId);
                } else {
                    console.log(`Error ${statusCode}: ${error.message}`);
                    updateStatusMessage('StepFiveValidation', `Response Error Status ${error.message}`);
                }
            } else {
                updateStatusMessage('StepFiveValidation', `Response Error Status ${error.message}`);
            }   
        }      
}


//setItem(expected_date+'_slot',slot)
function setItem(key, value) {
    const data = getStorage();
    data[key] = value;
    fs.writeFileSync('localStorage.json', JSON.stringify(data));
}

// Get data
function getItem(key) {
    const data = getStorage();
    return data[key];
}

// Get all storage
function getStorage() {
    try {
        return JSON.parse(fs.readFileSync('localStorage.json', 'utf8'));
    } catch (err) {
        return {};
    }
}

// Function to open a link
function openLink(url) {
    const startCommand = process.platform === 'win32' ? 'start ""' :
                         process.platform === 'darwin' ? 'open' : 'xdg-open';

    exec(`${startCommand} "${url}"`, (err) => {
        if (err) {
            console.error('Failed to open the link:', err);
        } else {
            console.log('Link opened successfully');
        }
    });
}

// Function to update OTP message
function updateStatusMessage(id,message,color=null) {

    if (color){
        console.log(color,id+': '+message+'\n');
    }else{
        console.log(id+': '+message+'\n');
    }
    
}