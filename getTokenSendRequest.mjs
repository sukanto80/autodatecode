
import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import puppeteer from 'puppeteer';
import qs from 'qs';

// Set base URL for API requests
const apiBaseUrl = 'https://payment.ivacbd.com';

// Set API endpoints
const otpSendUrl = `${apiBaseUrl}/queue-manage`;
const timeSlotUrl = `${apiBaseUrl}/get_payment_options_v2`;
const payNowUrl = `${apiBaseUrl}/slot_pay_now`;

const today = new Date();
const bdTimeOffset = 6 * 60; // Bangladesh is UTC+6
const utcTime = today.getTime() + today.getTimezoneOffset() * 60000;
const bdTime = new Date(utcTime + bdTimeOffset * 60000);

const nextDayBdTime = new Date(bdTime);
nextDayBdTime.setDate(bdTime.getDate() + 1);

// Format the next date as YYYY-MM-DD
const nextDate = nextDayBdTime.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

// data info variables
var expected_date = "2024-11-10";//nextDate;

//Date Release time
const targetTime = '17:50:00'; // Target time in HH:mm:ss format

let application = [
    { web_file: "BGDDW1CF2224", applicant_name: "NEJAM UDDIN" },
    { web_file: "BGDDW1CF3224", applicant_name: "FOYEZ AHMED" },
];   


var mobile="01829006154";
var email = "pakkna@gmail.com";

var MainCenterId = 1; // Dhaka 1 , Chittagong 2, Rajshahi 3,Sylhet 4, KHULNA 5
var VisaCenterId = 17;  //DHaka 17, JESSORE 12, KHULNA 19
var VisaTypeId = 13; // MEDICAL VISA 13 // ENTRY VISA 6 // TOURIST VISA 3

// Set CSRF token  &&  API key
let csrfToken, apiKey;

// funtion processing Variable;

let isOtpSendRequestStop = false;
let isOtpVerifyRequestStop = false;
let isGetOtpRequestInProgress = false;
let isOtpRequestInProgress = false;
let isOtpVerifyRequestInProgress = false;
let isSlotTimeRequestInProgress = false;
let isSlotTimeRequestStop = false;
let isFinalPayNowRequestStop = false;
let isOtpReceived = false;

let timeoutId; // set timeout id;


let otherBatchTimeoutId; // set timeout id;
const otherBatchTimeouts = []; // Array to store timeout IDs

let validationTimeoutId = null;
let fetchOtpTimeoutId = null;
let payNowtimeoutId = null;
let dateSlotTimeoutId=null; // set timeout id;

let isOtpVerified = false;
let checkGetTimeSlot = false;
let resendOtp=0;
let ReceivedOTP="";
let selected_slot ="";

// Sample array of objects
const MainCenterlist = [
    { id: 1, c_name: "Dhaka", prefix: "D" },
    { id: 2, c_name: "Chittagong", prefix: "C" },
    { id: 3, c_name: "Rajshahi", prefix: "R" },
    { id: 4, c_name: "Sylhet", prefix: "S" },
    { id: 5, c_name: "Khulna", prefix: "K" }
];
const VisaCenterList = [
    { id: 12, center_info_id: 1, ivac_name: "IVAC, JESSORE", prefix: "D", visa_fee: "800.00",app_key: "IVACJESSORE"},
    { id: 17, center_info_id: 1, ivac_name: "IVAC , DHAKA", prefix: "D", visa_fee: "800.00", app_key: "IVACDHAKA" },
    { id: 18, center_info_id: 3, ivac_name: "IVAC , RAJSHAHI", prefix: "R", visa_fee: "800.00", app_key: "IVACRAJSHAHI" },
    { id: 19, center_info_id: 5, ivac_name: "IVAC, KHULNA", prefix: "K", visa_fee: "800.00", app_key: "IVACKHULNA" },
    { id: 20, center_info_id: 7, ivac_name: "IVAC , SYLHET", prefix: "S", visa_fee: "800.00", app_key: "IVACSYLHET" },
    { id: 21, center_info_id: 9, ivac_name: "IVAC , CHITTAGONG", prefix: "C", visa_fee: "800.00", app_key: "IVACCHITTAGONG" },
    { id: 22, center_info_id: 11, ivac_name: "IVAC , BARISAL", prefix: "B", visa_fee: "800.00", app_key: "IVACBARISAL" },
    { id: 23, center_info_id: 13, ivac_name: "IVAC , COMILLA", prefix: "M", visa_fee: "800.00", app_key: "IVACCOMILLA" }
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
            phone: mobile,
            email: email,
            amount: "800.00",
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


let selected_payment={
    name: "Bkash",
    slug: "bkash",
    grand_total: application.length * 800 + application.length*24,
    link: "https://securepay.sslcommerz.com/gwprocess/v4/image/gw1/bkash.png",
  };


//Headers for Axios request
const axiosConfig = {
    headers: {
        'Connection': 'keep-alive',
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8;",
        'Referer': 'https://payment.ivacbd.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
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


let otpKey=filesInfo.payment[0].web_id+'-'+expected_date+'-otp';
let selectedSlotKey=filesInfo.payment[0].web_id+'-'+expected_date+'-slot';
let otpVerifiedKey = filesInfo.payment[0].web_id + '-' + expected_date + '-otpVerified';
let cookiesKey = filesInfo.payment[0].web_id + '_'+expected_date + '_cookies';
let validationKey = filesInfo.payment[0].web_id + '_'+expected_date + '_stepVerify'; 
  
let checkOtpGet=getItem(otpKey);
let checkSelectedSlot=getItem(selectedSlotKey);
let checkOtpVerify = getItem(otpVerifiedKey);
let getCookies = getItem(cookiesKey);


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

    let isvalidated = getItem(validationKey);

    if (isvalidated != undefined && isvalidated) {

        console.log("====== FILE 5 STEP ALREADY VALIDATED. START TO SCHEDULE ======\n");
          // Wait for user input to proceed
        //await new Promise(resolve => process.stdin.once('data', resolve));
         scheduleRequestSetup(targetTime);
        
    } else {
        console.log("====== FILE 5 STEP NOT VALIDATED. START VALIDATION ======\n");
       
        //await new Promise(resolve => process.stdin.once('data', resolve));
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
  

if(checkSelectedSlot!==undefined){
    selected_slot=checkSelectedSlot;
    checkGetTimeSlot=true;

}

ReceivedOTP=(checkOtpGet!==undefined) ? checkOtpGet:"";

isOtpVerified = (checkOtpVerify !== undefined) ? checkOtpVerify : false;

// Function to get an object by name
function getObjectByName(objectArray,id) {
    return objectArray.find(obj => obj.id === id);
}

function getRandomDelay() {
    const randomDelay = Math.floor(Math.random() * (1000 - 500 + 1)) + 300;
    return randomDelay;
}

function timeSlotRandomDelay() {
    const randomDelay = Math.floor(Math.random() * (1000 - 500 + 5)) + 500;
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

    try {

        const response = await axios.post(payNowUrl, payNowSubmitData,axiosConfig);

        const resp = response.data;

        updateStatusMessage('finalPayMSG',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' );

        if (resp.status ===	"FAIL") {

            var error_reason=(typeof resp?.errors !== 'undefined') ? resp.errors: "Pay Now Data response error.Resending...";
            
            if (error_reason=="Mobile no is not verified with this requested webfiles") {
                updateStatusMessage('finalPayMSG',error_reason);
            }else if (error_reason == "selected slot visa_type and webfile visa_type_id not match") {
                   updateStatusMessage('finalPayMSG',error_reason);
            } else if (error_reason == " Available slot is less than zero" || error_reason == "Available slot is less than zero") {
                
                updateStatusMessage('finalPayMSG', error_reason);
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, 1500);
            }
            else{
                updateStatusMessage('finalPayMSG',error_reason);
            }

        }else if (resp.status !=="FAIL") {

            if(typeof resp.data?.status !== 'undefined'){
                 
                if(resp.data.status === 'OK' && typeof resp.data?.url !== 'undefined') {
                    
                        isFinalPayNowRequestStop=true;

                        //clearTimeout(payNowtimeoutId);
                        
                        if(typeof resp.data?.order_id !== 'undefined'){
                          
                            updateStatusMessage('finalPayMSG','Payment OrderId: '+resp.data.order_id +' Found Successfully','\x1b[32m%s\x1b[0m' );
                
                            //localStorage.setItem('last_order_id', resp.data.order_id);
                        }
                        updateStatusMessage('finalPayMSG URL',resp.data.url+selected_payment.slug,'\x1b[34m\x1b[4m');
                        openLink(resp.data.url+selected_payment.slug);
                }else{
                    updateStatusMessage('finalPayMSG','Payment gateway not running right now.Resending..');
                    payNowtimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
                }        

            }else{
               
                updateStatusMessage('finalPayMSG','Failed to verify response data! Resending Request...');
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
            }   

        }else{
            updateStatusMessage('finalPayMSG','Response data invalid! Resending Request...');
            payNowtimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
        }

        
    } catch (error) {
        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('finalPayMSG', error.response.status +' Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
                updateStatusMessage('finalPayMSG',error.response.status + ' Gateway timeout! Resending Request');
            }else{
                updateStatusMessage('finalPayMSG', 'An error occurred: ' + error.message);
                console.log('Error:', error.message);
            }
        }
        updateStatusMessage('finalPayMSG', 'Final pay request server error. Resending request....');
        payNowtimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
    }
}

// Function to handle slot time request with caching
const getDateTimeSlotRequest = async()=>{

     if (isSlotTimeRequestInProgress) {
        updateStatusMessage('timeSlotMsg', 'TIme Slot Request stoped Successfully');
        return;
    }
    if (isSlotTimeRequestStop) {
        updateStatusMessage('timeSlotMsg', 'TIme Slot Request stoped Successfully');
        return;
    }else if (checkGetTimeSlot) {
        updateStatusMessage('timeSlotMsg','Slot Already Selected:'+selected_slot.time_display);
        return;
    }

    const timeSlotPostData = qs.stringify({
        apiKey: apiKey,
        action: 'generateSlotTime',
        amount: '10.00',
        ivac_id: filesInfo.payment[0].ivac.id,
        visa_type: filesInfo.payment[0].visa_type.id,
        specific_date: expected_date,
        info: filesInfo.payment,
    });

    isSlotTimeRequestInProgress = true;
    axiosConfig.headers['User-Agent'] = getRandomUserAgent();
    

    try {
        const response = await axios.post(timeSlotUrl, timeSlotPostData, axiosConfig);

        const resp = response.data;

             isSlotTimeRequestInProgress = false;

            if (resp.status=='OK' && resp.slot_times.length===0) {

                updateStatusMessage('timeSlotMsg', 'Time slot not available in this time.Resending...');

                dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, 1500);

            }else if(resp.status=='OK' && resp.slot_times.length!==0){

                    updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                    
                    selected_slot = resp.slot_times[0];
                    filesInfo.payment[0].appointment_time = selected_slot.hour;
                    
                    isSlotTimeRequestStop = true;
                    checkGetTimeSlot=true;

                    setItem(selectedSlotKey, selected_slot);
                    
                    //save Time Slot to api server
                    SaveTimeSlot(resp.slot_times);

                    //Stop sending Request
                    clearTimeout(dateSlotTimeoutId);

                updateStatusMessage('timeSlotMsg', "AvailableSlot :" + selected_slot.availableSlot + " Selected Time: " + selected_slot.time_display, '\x1b[32m%s\x1b[0m');
                
                if (checkGetTimeSlot && isOtpVerified) {
                    updateStatusMessage('timeSlotMsg','Sending final PayNow request....');
                    FinalPayNowV2Request();
                }           

            } else {
                updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                updateStatusMessage('timeSlotMsg', 'Time Slot is Empty! Resending Request...');

                dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, timeSlotRandomDelay);
            }    

    } catch (error) {

         isSlotTimeRequestInProgress = false;
       
        if (error.response) {
            const statusCode = error.response.status;

            if (statusCode === 504 || statusCode === 502) {  // Gateway timeout
                updateStatusMessage('timeSlotMsg', `${statusCode} Gateway timeout! Resending Request`);
                clearTimeout(dateSlotTimeoutId);
                dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, timeSlotRandomDelay);

            } else if (statusCode === 500) {  
                updateStatusMessage('timeSlotMsg', `${statusCode} Request Data Error! Check data.`);
            }else if (statusCode === 429) {  
                updateStatusMessage('timeSlotMsg', `${statusCode} Request Rate Limit Excided.`);
                console.log("\n====== Request Rate Limit Excided . Please Change Your IP Then Press Enter ======\n");
                // Wait for user input to proceed
                await new Promise(resolve => process.stdin.once('data', resolve));

                dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, timeSlotRandomDelay);

            }else if (statusCode === 403) {  // Forbidden
                updateStatusMessage('timeSlotMsg', `${statusCode} Access forbidden! Check permissions.`);
                clearTimeout(dateSlotTimeoutId);
                dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, timeSlotRandomDelay);
            } else {
                console.log(`Error ${statusCode}: ${error.message}`);
                updateStatusMessage('timeSlotMsg', `An error occurred: ${error.message}`);
            }
        } else {
            updateStatusMessage('timeSlotMsg', `An error occurred: ${error.message}`);
        }

    }
}

// Function to handle OTP verification
const sendVerifyOtpRequest = async () => {
    
    if (isOtpVerifyRequestInProgress) {
        updateStatusMessage('otpVerify','OTP Verify Request in progress, please wait...');
        return;
    }else if (isOtpVerifyRequestStop) {
        updateStatusMessage('otpVerifyMsg','OTP Verify Request Stoped Successfully');
        return;
    } else if (isOtpVerified) {
        updateStatusMessage('otpVerifyMsg','OTP Already Verified.request Stoped Successfully');
        return;
    }

    const otpVerifyData =  qs.stringify({
        _token: csrfToken,
        apiKey: apiKey,
        action: 'verifyOtp',
        info: filesInfo.payment,
        otp: ReceivedOTP,
    });
    isOtpVerifyRequestInProgress = true;
    
    axiosConfig.headers['User-Agent'] = getRandomUserAgent();
    
    try {
        // Send POST request with Axios
        const response = await axios.post(otpSendUrl, otpVerifyData, axiosConfig);

        const resp = response.data;

         isOtpVerifyRequestInProgress = false;

        if (resp.status ===	"FAILED" && resp.code === 422) {
            
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
            var error_reason = resp.data.error_reason;
            
            clearTimeout(timeoutId);
            isOtpVerifyRequestStop = true;

            if (error_reason=="OTP expired. Please try again" || error_reason=="OTP does not match. Please try again") {
               
                if(ReceivedOTP.length == 6){
                    updateStatusMessage('otpVerifyMsg',error_reason);

                    ReceivedOTP="";
                    resendOtp=1;
                    sendOtpPostRequest();
                }else{
                    updateStatusMessage('otpVerifyMsg','Otp length is not valid.Fetching New OTP...');

                    if (ReceivedOTP=="" || ReceivedOTP.length != 6) {
                        fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1500);
                    }
                } 
            }else if(error_reason.includes("OTP not found with this mobile number")){
               
                clearTimeout(timeoutId);
                isOtpVerifyRequestStop = true;
                isOtpVerified=true;
                
                updateStatusMessage('otpVerifyMsg','OTP Not Found Mobile Number.Request Verified Successfully','success');
       
                if (checkGetTimeSlot && isOtpVerified) {

                    updateStatusMessage('finalPayMSG','Sending final PayNow request....');
                    FinalPayNowV2Request();
                }


            }else {
                updateStatusMessage('otpVerifyMsg',error_reason);
                // timeoutId = setTimeout(sendVerifyOtpRequest, 500);
                // timeouts.push(timeoutId);
            }

        }else if (resp.status ==="SUCCESS" && resp.code === 200){
    
                clearTimeout(timeoutId);
                isOtpVerifyRequestStop = true;
                isOtpVerified=true;
                
                updateStatusMessage('otpVerifyMsg','OTP Verified Successfully.','success');
       
                if (checkGetTimeSlot && isOtpVerified) {
                        updateStatusMessage('timeSlotMsg','Sending final PayNow request....');
                        FinalPayNowV2Request();
                }

        }else{
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
            updateStatusMessage('otpVerifyMsg', 'Failed to connect verify otp! Resending Request...');
            
           // timeoutId = setTimeout(sendVerifyOtpRequest, 200);
           // timeouts.push(timeoutId);
        } 
        
        
    } catch (error) {

        isOtpVerifyRequestInProgress = false;

        if (error.response) {
            const statusCode = error.response.status;
            
            if (statusCode === 504 || statusCode === 502) {  // Gateway timeout
                updateStatusMessage('otpVerifyMsg', `${statusCode} Gateway timeout! Resending Request`);
                clearTimeout(dateSlotTimeoutId);
                
                timeoutId = setTimeout(sendVerifyOtpRequest, getRandomDelay);

            } else if (statusCode === 500) {  
                updateStatusMessage('otpVerifyMsg', `${statusCode} Request Data Error! Check data.`);
            }else if (statusCode === 429) {  
                updateStatusMessage('otpVerifyMsg', `${statusCode} Request Rate Limit Excided.`);

                console.log("\n====== Request Rate Limit Excided . Please Change Your IP Then Press Enter ======\n");
                // Wait for user input to proceed
                await new Promise(resolve => process.stdin.once('data', resolve));
                timeoutId = setTimeout(sendVerifyOtpRequest, getRandomDelay);

            }else if (statusCode === 403) {  // Forbidden
                updateStatusMessage('otpVerifyMsg', `${statusCode} Access forbidden! Check permissions.`);

                timeoutId = setTimeout(sendVerifyOtpRequest, getRandomDelay);
                
            } else {
                console.log(`Error ${statusCode}: ${error.message}`);
                updateStatusMessage('otpVerifyMsg', `An error occurred: ${error.message}`);
            }
        } else {
            updateStatusMessage('otpVerifyMsg', `An error occurred: ${error.message}`);
        }
      
    }
}

const sendOtpPostRequest = async() => {
    
    if (isOtpRequestInProgress) {
        updateStatusMessage('otpSendMsg', 'OTP Send Request in progress, waiting for completion...');
        return;
    } else if(isOtpSendRequestStop) {
         updateStatusMessage('otpSendMsg', 'OTP Send Request Stoped successfully.');
        return;
    }

    isOtpRequestInProgress = true;

    axiosConfig.headers['User-Agent'] = getRandomUserAgent();

    const OtpSendPostData =  qs.stringify({
        _token: csrfToken,
        apiKey: apiKey,
        action: 'sendOtp',
        info: filesInfo.payment,
        resend: resendOtp,
    });

    try {
        
        // Send POST request with Axios
        const response = await axios.post(otpSendUrl, OtpSendPostData,axiosConfig);

        const resp = response.data;

        //console.log('Response:', response.data);

        isOtpRequestInProgress = false;
        // Handle different response scenarios
        if (resp.status === "FAILED" && resp.code === 422) {
            updateStatusMessage('otpSendMsg', 'Slot is not available to send OTP. Retrying...');

            timeoutId = setTimeout(sendOtpPostRequest, 2000);

        } else if (resp.status == "SUCCESS" && resp.code === 200) {

            updateStatusMessage('otpSendMsg', 'OTP Sent Successfully. Finding OTP....','\x1b[32m%s\x1b[0m');
            //updateStatusMessage('otpSendMsg',JSON.stringify(resp, null, 2),'\x1b[34m%s\x1b[0m' ); //log response data
            //Stop sending Request
            clearTimeout(timeoutId);
            isOtpSendRequestStop=true;
            // Function to get OTP from API

        } else {
            timeoutId = setTimeout(sendOtpPostRequest, getRandomDelay);
            updateStatusMessage('otpSendMsg',  resp.data.error_reason);
        }

    } catch (error) {
        isOtpRequestInProgress = false;

        if (error.response) {
            const statusCode = error.response.status;

            if (statusCode === 504 || statusCode === 502) {  // Gateway timeout
                updateStatusMessage('timeSlotMsg', `${statusCode} Gateway timeout! Resending Request`);       
                timeoutId = setTimeout(sendOtpPostRequest, getRandomDelay);

            } else if (statusCode === 500) {  
                updateStatusMessage('otpSendMsg', `${statusCode} Request Data Error! Check data.`);
            }else if (statusCode === 429) {  
                updateStatusMessage('otpSendMsg', `${statusCode} Request Rate Limit Excided.`);

                console.log("\n====== Request Rate Limit Excided . Please Change Your IP Then Press Enter ======\n");
                // Wait for user input to proceed
                await new Promise(resolve => process.stdin.once('data', resolve));
                timeoutId = setTimeout(sendOtpPostRequest, getRandomDelay);

            }else if (statusCode === 403) {  // Forbidden
                updateStatusMessage('otpSendMsg', `${statusCode} Access forbidden! Check permissions.`);

                timeoutId = setTimeout(sendOtpPostRequest, getRandomDelay);
                
            } else {
                console.log(`Error ${statusCode}: ${error.message}`);
                updateStatusMessage('otpSendMsg', `An error occurred: ${error.message}`);
            }
        } else {
            updateStatusMessage('otpSendMsg', `An error occurred: ${error.message}`);
        }

    }
}

// Function to get OTP from API using axios
async function getOtpFromApi() {

    if (isGetOtpRequestInProgress || isOtpReceived) return;

    isGetOtpRequestInProgress = true;

    try {
        const response = await axios.get('https://api.costbuildpro.xyz/api/ivac', {
            params: {
                m: filesInfo.payment[0].phone //mobile number of otp
            },
        });

        // Handle the successful response
        const resp = response.data;
        isGetOtpRequestInProgress = false;
        
        if (resp.success && resp.data.otp !== '') {


            if (resp.data.otp.length ===6){

                isOtpReceived = true;
                filesInfo.payment[0].otp = resp.data.otp;
                ReceivedOTP=resp.data.otp;
                
                setItem(otpKey,ReceivedOTP);
                
                isOtpSendRequestStop = true;

                //Stop sending Request
                clearTimeout(timeoutId);

                clearTimeout(fetchOtpTimeoutId);

               // Display success message

                updateStatusMessage('OTPGet','OTP Received Successfully. OTP Received: ' + resp.data.otp,'\x1b[32m%s\x1b[0m');

                sendVerifyOtpRequest();

            } else {
                // Handle invalid OTP
                updateStatusMessage('OTPGet','OTP Received Successfully. OTP Invalid: ' + resp.data.otp);

                fetchOtpTimeoutId = setTimeout(getOtpFromApi, 2000);
            }

        } else {
            updateStatusMessage('OTPGet','OTP is empty or undefined. Retrying...');
            
                fetchOtpTimeoutId = setTimeout(getOtpFromApi, 2000);
        }

    } catch (error) {
        // Handle error
        isGetOtpRequestInProgress = false;
        updateStatusMessage('OTPGet','Error fetching OTP. Retrying...'+error);
        fetchOtpTimeoutId = setTimeout(getOtpFromApi, 2000); // Retry after 1 second
    }   
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
        if (currentTimeMs >= targetTimeMs) {
            // Your logic for OTP request and slot fetching

            clearInterval(interval); // Stop checking after the function is called

            console.log('\n STARTING REQUEST SENDING IN TIME\n'); 
            sendOtpPostRequest();
            getOtpFromApi();
            //FinalPayNowV2Request();
            getDateTimeSlotRequest();
            
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
    for (let step = 2; step <= 5; step++) {
        try {
            // Introduce a delay of 1000-1500 ms before each step
            await new Promise(resolve => setTimeout(resolve, getRandomDelay));

            const response = await axios.get(`${apiBaseUrl}/payment/check-step/${step}`, validationHeader);
            console.log('Payment Check Response:', response.data); // Log the full response for debugging
            
            if (response.data === false || response.data === 'false') {
                updateStatusMessage('FileValidation', `File Verify Step ${step} Completed successfully`);
                if (step === 5) {
                    setItem(validationKey,1);
                    scheduleRequestSetup(targetTime);
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

async function SaveTimeSlot(slotTimes) {
    var slotPostData = {
        slot_key: filesInfo.payment[0].ivac.app_key,
        slot_data: slotTimes,
    };

    try {
        const response = await axios.post('https://api.costbuildpro.xyz/api/save-slot', slotPostData);
        const resp = response.data;
        
        if (resp.success === true) {
            updateStatusMessage('TimeSlotStore', 'Collected Slot Saved Successfully', '\x1b[32m%s\x1b[0m');
            return 1;
        }
    } catch (error) {
        // Retry if we get a 504, 502, or 503 error (gateway timeout/server overload)
        if (error.response && [504, 502, 503].includes(error.response.status)) {
            console.log('Slot Error: ' + error + ' Gateway timeout! Resending Request');
        } else {
            console.log('Slot Error: ' + error + ' Resending Request');
        }

        // Use a promise-based delay to retry
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return await SaveTimeSlot(slotTimes);  // Pass slotTimes for the retry
    }
}



async function getSaveTimeSlot() {

    try {

        const response = await axios.get('https://api.costbuildpro.xyz/api/save-slot', {
            params: {
                slot_key: filesInfo.payment[0].ivac.app_key
            },
        });
        
        const resp = response.data;

        if (resp.success == true &&  Array.isArray(resp.data)) {

           console.log("slot Save Response: " + JSON.stringify(resp));
            updateStatusMessage('FileValidation', `Saved Slot Got Successfullly`, 'Success');
            
        } else {
            updateStatusMessage('FileValidation', `Saved Slot Got Error `, 'danger');
        }

    } catch (error) {
         // Retry if we get a 504, 502, or 503 error (gateway timeout/server overload)

        if (error.response && [504, 502, 503].includes(error.response.status)) {
             console.log('Slot Error'+ error + ' Gateway timeout! Resending Request');
        } else {
              console.log('Slot Error'+ error + ' Gateway timeout! Resending Request');
        }

        setTimeout(getSaveTimeSlot, 1000); // Retry after 200ms for other errors
    };
};


//step 1: file validation
//validateApplication();

//getSessionCookies();

 // date selection request
//sendBatchedRequests(getDateTimeSlotRequest);
 //otp send request
//sendOtpPostRequest();

//getOtpFromApi();

 // check otp found or not
 //getOtpFromApi();

// if(isOtpVerified && selected_slot!=""){
//     FinalPayNowV2Request();
// }else if(ReceivedOTP!==""){
//     sendVerifyOtpRequest();

// }else if(selected_slot!=""){
//     // date selection request
//     OtherProcessBatchedRequests(getDateTimeSlotRequest);
// }else{
//     // date selection request
//     OtherProcessBatchedRequests(getDateTimeSlotRequest);
//     //otp send request
//     OtpProcessBatchedRequests(sendOtpPostRequest);
//     // check otp found or not
//     getOtpFromApi();
// }


//scheduleOtpRequest(targetTime);
//sendVerifyOtpRequest();
//FinalPayNowV2Request();
//getDateTimeSlotRequest();
//sendOtpPostRequest();
//getOtpFromApi();

//OtpProcessBatchedRequests(sendOtpPostRequest);


//setItem(expected_date+'_slot',slot)
function setItem(key, value) {
    const data = getStorage();
    data[key] = value;
    fs.writeFileSync('storage.json', JSON.stringify(data));
}

// Get data
function getItem(key) {
    const data = getStorage();
    return data[key];
}

// Get all storage
function getStorage() {
    try {
        return JSON.parse(fs.readFileSync('storage.json', 'utf8'));
    } catch (err) {
        return {};
    }
}

// Function to open a link
function openLink(url) {
    const startCommand = process.platform === 'win32' ? 'start' :
                         process.platform === 'darwin' ? 'open' : 'xdg-open';

    exec(`${startCommand} ${url}`, (err) => {
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