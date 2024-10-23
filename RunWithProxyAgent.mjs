//const puppeteer = require('puppeteer');
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';
import qs from 'qs';
import { exec } from 'child_process';
import https from 'https';
import fs from 'fs';

//Date Release time
const targetTime = '18:00:01'; // Target time in HH:mm:ss format

// data info variables
var expected_date="2024-10-23";
var web_file="BGDKV133DC24";
var applicant_name="ANJON SARDER";
var mobile="01829006154";
var email= "pakkna@gmail.com";
var my_visa_type= "MEDICAL/MEDICAL ATTENDANT VISA"; //"ENTRY VISA"


//const cacheFilePath = './timeslotcache.txt'; // The cache file path

const proxyList = [
    "socks4://mkshuvo420:mkshuvo420@198.23.239.134:6540", //ORD53-C1
    "socks4://mkshuvo420:mkshuvo420@207.244.217.165:6712", // VIE50-P2
    "socks4://mkshuvo420:mkshuvo420@107.172.163.27:6543", // JFK50-P6
    "socks4://mkshuvo420:mkshuvo420@173.211.0.148:6641", // LAX53-P4
    "socks4://mkshuvo420:mkshuvo420@216.10.27.159:6837", // LAX53-P4
    "socks4://mkshuvo420:mkshuvo420@167.160.180.203:6754", // LAX53-P4
    "socks4://mkshuvo420:mkshuvo420@154.36.110.199:6853", //MAD51-C2
    "socks4://mkshuvo420:mkshuvo420@173.0.9.70:5653", // IAD12-P2
    "socks4://mkshuvo420:mkshuvo420@173.0.9.209:5792", //IAD12-P2
    "socks4://mkshuvo420:mkshuvo420@161.123.152.115:6360" // MAD51-C2
];

function getHeaderConfig(){
    let  httpsAgent;


    if(isSendWithProxyAgent==true){

        proxyReleaseCount++;
        isSendWithProxyAgent=proxyReleaseCount>10? false: true;

        let randomIndex = Math.floor(Math.random() * proxyList.length);
        let randomProxy = proxyList[randomIndex];

         httpsAgent = new HttpsProxyAgent(randomProxy);
    }else{
        proxyReleaseCount=0;
        errorForbiddenCount=errorForbiddenCount==2?0:errorForbiddenCount;
         httpsAgent = new https.Agent({ keepAlive: true });
    }
   

//const httpAgent = new http.Agent({ keepAlive: true });
//const httpsAgent = new https.Agent({ keepAlive: true });

// Headers for Axios request
const axiosConfig = {
   httpsAgent: httpsAgent,
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20500101 Firefox/131.0'
    },
    timeout: 5000,
};

return axiosConfig;
}

let csrfToken, apiKey;

csrfToken= apiKey= "H0VvZHtgxl364wy9ouVdhH7OL7joK2iGId8fY0Lu";


// Set base URL for API requests
const apiBaseUrl = 'https://payment.ivacbd.com';

// Set API endpoints
const otpSendUrl = `${apiBaseUrl}//api/v1/queue-manage`;
const timeSlotUrl = `${apiBaseUrl}/api/get_payment_options_v2`;
const payNowUrl = `${apiBaseUrl}/slot_pay_now`;

// funtion processing Variable;
let checkOtpVerified = false;
let checkGetTimeSlot = false;
let isOtpRequestInProgress = false;
let isOtpVerifyRequestInProgress = false;
let isSlotTimeRequestInProgress = false;
let isFinalPayNowRequestInProgress = false;
let isOtpReceived = false;
let isGetOtpRequestInProgress = false;
let dateSlotTimeoutId = null;
let timeoutId = null;
let fetchOtpTimeoutId = null;
let payNowtimeoutId = null;
let resendOtp=0;
let isSendWithProxyAgent=false;
let errorForbiddenCount=0;
let proxyReleaseCount=0;
let ReceivedOTP="";


let selected_slot={}; 

// VIsa Type array of objects
const VisaTypeArray = [
    { id: 1, type_name: "TOURIST VISA", order: 1, is_active: 1 },
    { id: 13, type_name: "MEDICAL/MEDICAL ATTENDANT VISA", order: 2, is_active: 1},
    { id: 2, type_name: "STUDENT VISA", order: 6, is_active: 1 },
    { id: 6, type_name: "ENTRY VISA", order: 5, is_active: 1}
];

let dhaka_center={
    id: "1",
    c_name: "Dhaka",
    prefix: "D",
    is_delete: "0"
};

let dhaka_ivac={
                id: 17,
                center_info_id: 1,
                ivac_name: "IVAC, Dhaka (JFP)",
                address: "Jamuna Future Park",
                prefix: "D",
                visa_fee: "800.00",
                app_key: "IVACJFP",
                charge: "3",
                new_visa_fee: "800.00",
                old_visa_fee: "800.00",
                notify_fees_from: "2018-07-29 04:54:32",
                allow_old_amount_until_new_date: 2,
                max_notification_count: 2,
};

let filesInfo ={

    payment:[
        {
            web_id: web_file,
            web_id_repeat: web_file,
            name: applicant_name,
            phone: mobile,
            email: email,
            amount: "800.00",
            captcha: "",
            center: { id: 5, c_name: "Khulna", prefix: "K", is_delete: "0" },
            is_open: "true",
            ivac: {
                id: 3,
                center_info_id: 5,
                app_key: "IVACKHULNA",
                ivac_name: "IVAC, KHULNA",
                prefix: "D",
                charge: "3",
                allow_old_amount_until_new_date: 2,
                max_notification_count: 2,
                new_visa_fee: "800.00",
                old_visa_fee: "800.00",
                visa_fee: "800.00",
                new_fees_applied_from: "2018-08-05 00:00:00",
                notify_fees_from: "2018-07-29 04:54:32"
              },
            visa_type: getObjectByName(my_visa_type, VisaTypeArray),
            confirm_tos: "true",
            otp:ReceivedOTP,
        }
    ],
};


let selected_payment={
    name: "Bkash",
    slug: "bkash",
    grand_total: 824,
    link: "https://securepay.sslcommerz.com/gwprocess/v4/image/gw1/bkash.png",
  };


// Function to get an object by name
function getObjectByName(name,objectArray) {
    return objectArray.find(obj => obj.type_name === name);
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

// Function to handle PayNow Payment Request
async function FinalPayNowV2Request() {
    if (isFinalPayNowRequestInProgress) {
        updateStatusMessage('timeSlotMsg', 'Pay Now Request in progress, please wait...');
        return;
    }
    
    isFinalPayNowRequestInProgress = true;
    
    const payNowSubmitData =qs.stringify({
        _token: csrfToken,
        apiKey: apiKey,
        action:'payInvoice',
        info : filesInfo.payment,
        selected_payment : selected_payment,
        selected_slot : selected_slot,
    });

    let axiosConfig=getHeaderConfig();

    try {

        const response = await axios.post(payNowUrl, payNowSubmitData,axiosConfig);

        const xAmzCfPop = response.headers['x-amz-cf-pop'];

        console.log('Pay-Now-pop:', xAmzCfPop);

        const resp = response.data;

        isFinalPayNowRequestInProgress = false;


        updateStatusMessage('finalPayMSG',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' );

        if (resp.status ===	"FAIL") {

            var error_reason=(typeof resp?.errors !== 'undefined') ? resp.errors: "Pay Now Data response error.Resending...";
            
            if (error_reason=="Mobile no is not verified with this requested webfiles" || error_reason=="OTP not found with this mobile number") {
                updateStatusMessage('finalPayMSG',error_reason);
            }else if (error_reason==" Available slot is less than zero" || error_reason=="Available slot is less than zero"){
                updateStatusMessage('finalPayMSG',error_reason);
            }
            else{
                updateStatusMessage('finalPayMSG',error_reason);
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, 500);
            }

        }else if (resp.status !=="FAIL") {

            if(typeof resp.data?.status !== 'undefined'){
                 
                if(resp.data.status === 'OK' && typeof resp.data?.url !== 'undefined') {
                    
                        clearTimeout(payNowtimeoutId);
                        
                        if(typeof resp.data?.order_id !== 'undefined'){
                          
                            updateStatusMessage('finalPayMSG','Payment OrderId: '+resp.data.order_id +' Found Successfully','\x1b[32m%s\x1b[0m' );
                
                            //localStorage.setItem('last_order_id', resp.data.order_id);
                        }
                        updateStatusMessage('finalPayMSG URL',resp.data.url+selected_payment.slug,'\x1b[34m\x1b[4m');
                        openLink(resp.data.url+selected_payment.slug);
                }else{
                    updateStatusMessage('finalPayMSG','Payment gateway not running right now.Resending..');
                    payNowtimeoutId = setTimeout(FinalPayNowV2Request, 500);
                }        

            }else{
               
                updateStatusMessage('finalPayMSG','Failed to verify response data! Resending Request...');
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, 500);
            }   

        }else{
            updateStatusMessage('finalPayMSG','Response data invalid! Resending Request...');
            payNowtimeoutId = setTimeout(FinalPayNowV2Request, 500);
        }

        
    } catch (error) {
        isFinalPayNowRequestInProgress = false;
        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('finalPayMSG', error.response.status + 'Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
            
                errorForbiddenCount++;
                console.log('Error 403 Forbidden count: ' + errorForbiddenCount);

                isSendWithProxyAgent = errorForbiddenCount >2 ? true: false;
                
                updateStatusMessage('finalPayMSG', error.response.status + 'Request Forbidden.');

            }else {
                updateStatusMessage('finalPayMSG', 'An error occurred: ' + error.message);
            }
        }
        payNowtimeoutId = setTimeout(FinalPayNowV2Request, 500);
    }
}

// Function to handle slot time request with caching
async function getDateTimeSlotRequest() {

    if (isSlotTimeRequestInProgress) {
        updateStatusMessage('timeSlotMsg', 'Request in progress, waiting for completion...');
        return;
    }

    if (checkGetTimeSlot) {
        updateStatusMessage('timeSlotMsg','Already Selected:'+selected_slot.time_display);
        return;
    }

    isSlotTimeRequestInProgress = true;

    const timeSlotPostData = qs.stringify({
        apiKey: apiKey,
        action: 'generateSlotTime',
        amount: '10.00',
        ivac_id: filesInfo.payment[0].ivac.id,
        visa_type: filesInfo.payment[0].visa_type.id,
        specific_date: expected_date,
        info: filesInfo.payment,
    });

    let axiosConfig=getHeaderConfig();

    try {
        const response = await axios.post(timeSlotUrl, timeSlotPostData, axiosConfig);

        const xAmzCfPop = response.headers['x-amz-cf-pop'];

        console.log('get-time-slot-pop:', xAmzCfPop);

        const resp = response.data;

        isSlotTimeRequestInProgress = false;

            updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data

            if (resp.status=='OK' && resp.slot_times.length===0) {

                 updateStatusMessage('timeSlotMsg', 'Time slot not available in this time.Resending...');
                 dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, 300);

            }else if(resp.status=='OK' && resp.slot_times.length!==0){

                    selected_slot = resp.slot_times[0];
                    filesInfo.payment[0].appointment_time = selected_slot.hour;
                    
                    checkGetTimeSlot = true;

                    updateStatusMessage('Selected Date: ',JSON.stringify(selected_slot, null, 2),'\x1b[32m%s\x1b[0m' ); //log selected_date data

                    console.log("AvailableSlot :"+selected_slot.availableSlot+" Selected Time: "+selected_slot.time_display);
                    updateStatusMessage('timeSlotMsg',"AvailableSlot :"+selected_slot.availableSlot+" Selected Time: "+selected_slot.time_display);
                    

            }else{
                updateStatusMessage('timeSlotMsg', 'Time Slot is Empty! Resending Request...');
                dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, 300);
            }    

    } catch (error) {
        isSlotTimeRequestInProgress = false;

        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('timeSlotMsg', error.response.status+' Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
            
                errorForbiddenCount++;
                console.log('Error 403 Forbidden count: ' + errorForbiddenCount);
                isSendWithProxyAgent = errorForbiddenCount >2 ? true: false;
            }else {
                updateStatusMessage('timeSlotMsg', 'An error occurred: ' + error.message);
            }
        }   
        
        dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, 300);
    }
}

// Function to handle OTP verification
async function sendVerifyOtpRequest() {
    if (isOtpVerifyRequestInProgress) {
        updateStatusMessage('otpVerifyMsg','OTP Verify Request in progress, please wait...');
        return;
    }

    isOtpVerifyRequestInProgress = true;

    const otpVerifyData =  qs.stringify({
        _token: csrfToken,
        apiKey: apiKey,
        action: 'verifyOtp',
        info: filesInfo.payment,
        otp: ReceivedOTP,
    });

    let axiosConfig=getHeaderConfig();
    
    try {
        // Send POST request with Axios
        const response = await axios.post(otpSendUrl, otpVerifyData, axiosConfig);

        const xAmzCfPop = response.headers['x-amz-cf-pop'];

        console.log('otpVerifyMsg-pop:', xAmzCfPop);

        const resp = response.data;

        isOtpVerifyRequestInProgress = false;

        

        if (resp.status ===	"FAILED" && resp.code === 422) {
            
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
            var error_reason=resp.data.error_reason;

            if (error_reason=="Mobile no is not verified with this requested webfiles" || error_reason=="OTP not found with this mobile number" ||  error_reason=="OTP expired. Please try again" || error_reason=="OTP does not match. Please try again") {
               
                if(ReceivedOTP.length == 6){
                    updateStatusMessage('otpVerifyMsg',error_reason+'.Resending...');
                    clearTimeout(timeoutId);
                    ReceivedOTP='';
                    resendOtp=1;
                    sendOtpPostRequest();
                }else{
                    updateStatusMessage('otpVerifyMsg','Otp length is not valid.Fetching New OTP...');

                    if (ReceivedOTP=='' || ReceivedOTP.length != 6) {
                        timeoutId = setTimeout(getOtpFromApi, 1000);
                    }
                } 
            }else if(error_reason=='Slot is not available'){
                updateStatusMessage('otpVerifyMsg','Slot is not available.Sending New OTP...');
                //sendOtpPostRequest();
                
            }else{
                updateStatusMessage('otpVerifyMsg',error_reason);
               // timeoutId = setTimeout(sendVerifyOtpRequest, 500);
            }

        }else if (resp.status ==="SUCCESS" && resp.code === 200){
    
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' );

                    checkOtpVerified==true;
           
                    updateStatusMessage('otpVerifyMsg','OTP Verified Successfully.','\x1b[32m%s\x1b[0m');
                   
                    if (checkGetTimeSlot && checkOtpVerified) {
                        clearTimeout(timeoutId);
                        clearTimeout(dateSlotTimeoutId);
                        updateStatusMessage('otpVerifyMsg','Sending final PayNow request....');
                        FinalPayNowV2Request();
                    }

        }else{
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
            updateStatusMessage('otpVerifyMsg','Failed to connect verify otp! Resending Request...');
           // timeoutId = setTimeout(sendVerifyOtpRequest, 500);
        } 
        
        
    } catch (error) {
        isOtpVerifyRequestInProgress = false;

        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('otpVerifyMsg', 'Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
            
                errorForbiddenCount++;
                console.log('Error 403 Forbidden count: ' + errorForbiddenCount);
                isSendWithProxyAgent = errorForbiddenCount >2 ? true: false;
            } else {
                updateStatusMessage('otpVerifyMsg', 'An error occurred: ' + error.message);
                console.log('Error:', error.message);
            }
        }
        timeoutId = setTimeout(sendVerifyOtpRequest, 500);
      
    }
}

async function sendOtpPostRequest() {
    
    if (isOtpRequestInProgress) {
        updateStatusMessage('otpSendMsg', 'OTP Send Request in progress, waiting for completion...');
        return;
    }

    isOtpRequestInProgress = true;

    const OtpSendPostData =  qs.stringify({
        _token: csrfToken,
        apiKey: apiKey,
        action: 'sendOtp',
        info: filesInfo.payment,
        resend: resendOtp,
    });

    let axiosConfig=getHeaderConfig();

    try {
        
        // Send POST request with Axios
        const response = await axios.post(otpSendUrl, OtpSendPostData,axiosConfig);

        const xAmzCfPop = response.headers['x-amz-cf-pop'];

        console.log('otp-send-pop:', xAmzCfPop);

        const resp = response.data;

        isOtpRequestInProgress = false;
    
        // Handle different response scenarios
        if (resp.status === "FAILED" && resp.code === 422) {
           updateStatusMessage('otpSendMsg', 'Slot is not available to send OTP. Retrying...');
           timeoutId = setTimeout(sendOtpPostRequest, 300);

        } else if (resp.status == "SUCCESS" && resp.code === 200) {

            updateStatusMessage('otpSendMsg', 'OTP Sent Successfully. Finding OTP....','\x1b[32m%s\x1b[0m');
            updateStatusMessage('otpSendMsg',JSON.stringify(resp, null, 2),'\x1b[34m%s\x1b[0m' ); //log response data
            
            //Stop sending Request
            clearTimeout(timeoutId);
           // Function to get OTP from API
            getOtpFromApi();  

        } else {
            timeoutId = setTimeout(sendOtpPostRequest, 300);
            updateStatusMessage('otpSendMsg',  resp.data.error_reason);
        }

    } catch (error) {
        isOtpRequestInProgress = false;
        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('otpSendMsg', 'Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
            
                errorForbiddenCount++;
                console.log('Error 403 Forbidden count: ' + errorForbiddenCount);
                isSendWithProxyAgent = errorForbiddenCount >1 ? true: false;
            }else{
                updateStatusMessage('otpSendMsg', 'An error occurred: ' + error.message);
                console.log('Error:', error.message);
            }
        }    
        
        timeoutId = setTimeout(sendOtpPostRequest, 300);
    }
}

//send with https request 

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

                ReceivedOTP=resp.data.otp;
               
                clearTimeout(fetchOtpTimeoutId);

                sendVerifyOtpRequest();
                // Display success message

                updateStatusMessage('OTPGet','OTP Received Successfully. OTP Received: ' + resp.data.otp,'\x1b[32m%s\x1b[0m');

            } else {
                // Handle invalid OTP
                updateStatusMessage('OTPGet','OTP Received Successfully. OTP Invalid: ' + resp.data.otp);

                if (ReceivedOTP=='') {
                    fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1000);
                }
            }

        } else {
            updateStatusMessage('OTPGet','OTP is empty or undefined. Retrying...');
            
                fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1000);
        }

    } catch (error) {
        // Handle error
        isGetOtpRequestInProgress = false;
        updateStatusMessage('OTPGet','Error fetching OTP. Retrying...'+error);
        fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1000); // Retry after 1 second
    }   
}

// Function to check the time and call sendOtpPostRequest if it's 10:00:01 AM BDT
async function scheduleOtpRequest(targetTime) {
    const interval = setInterval(async () => {
        const currentTime = getBangladeshTime();
        console.log(`Current Time in BDT: ${currentTime}`);
        
        // Check if the current time matches the target time
        if (currentTime === targetTime) {
            // Your logic for OTP request and slot fetching
            updateStatusMessage('Start', '\n Request For Date Slot and Otp Send ...');
            console.log('STARTING REQUEST OTP SENDING'); 
            getDateTimeSlotRequest();
            sendOtpPostRequest();
            clearInterval(interval); // Stop checking after the function is called
        } else {
            console.clear();
            console.log(`Not Yet Date Release Time ${targetTime} TO Match Current Time: ${currentTime} `);
        }
    }, 1000); // Check every second
}

scheduleOtpRequest(targetTime);
//sendVerifyOtpRequest();
//FinalPayNowV2Request();
//sendOtpPostRequest();
//getDateTimeSlotRequest();
//getOtpFromApi();

  // Function to write the string data to a text file
//  fs.writeFileSync(cacheFilePath, selected_slot, 'utf-8');


// function readFromTxtFile() {
//     try {
//         const data = fs.readFileSync(cacheFilePath, 'utf-8');
//         const parsedData = data; // Parse the string back to JSON
//         return parsedData;
//     } catch (err) {
//         console.error('Error reading or parsing the file:', err);
//         return null;
//     }
// }

// var slot={
//     "id": 141546,
//     "ivac_id": 17,
//     "visa_type": 18,
//     "hour": 10,
//     "date": "2024-10-16",
//     "availableSlot": 19,
//     "time_display": "10:00 - 10:59"
//   };

// //setItem(expected_date+'_slot',slot)
// function setItem(key, value) {
//     const data = getStorage();
//     data[key] = value;
//     fs.writeFileSync('storage.json', JSON.stringify(data));
// }

// // Get data
// function getItem(key) {
//     const data = getStorage();
//     return data[key];
// }

// // Get all storage
// function getStorage() {
//     try {
//         return JSON.parse(fs.readFileSync('storage.json', 'utf8'));
//     } catch (err) {
//         return {};
//     }
// }

