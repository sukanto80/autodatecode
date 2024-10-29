
import axios from 'axios';
import qs from 'qs';
import { exec } from 'child_process';
import https from 'https';
import fs from 'fs';


// Set CSRF token  &&  API key
let csrfToken, apiKey;

csrfToken = apiKey = 'Js8ie4u50a9Dp2qZ8geZWE7zcGocHqbEZMHKnUps';


// Set CSRF token && cookie

let xsrfToken = "eyJpdiI6IlFicDNJbUNwSnJYOWxUOVdwNnVrXC9BPT0iLCJ2YWx1ZSI6Ik9pU2h2bjhFVmRqcFNVOElwcW5pSFwvK3NzRUhyMWxWSGdKS01PRU1xMVlRQWlXQXA0dVk1eGU0NXVNRmNHS2F4IiwibWFjIjoiNGZjMmNiMjAxNzYxYjAwMTI5ZjJiOGE0MjFiMGEzYmNkYmQ5NjcyNDdmY2E2MjAyZDIwNzEyNThiMDk1MWEwYiJ9";
let ivacSession ="eyJpdiI6ImxwTnI3N01LWTJvRUVEclZ1M3pnSEE9PSIsInZhbHVlIjoiZVBKQUI3UWl5em4zaW1NVzVsb04yaTE3SEh6N3ZNZkdOdHRGR1RcL2tnZFhTdTErczFcL1VyXC9vOXBUcHFMN05LYSIsIm1hYyI6IjEzOWU4NjFlYzMxNmFkNWE1YzYwNzBjZDc0NDg1YjI3YjA2MmVkZTg2OGFjNThmMzY0NzVjZWQ0NWQ5Mzg3NjUifQ%3D%3D";
            
//Date Release time
const targetTime = '18:00:00'; // Target time in HH:mm:ss format

const agent = new https.Agent({
      keepAlive: true,           // Keep connection alive
      maxSockets: 10,            // Allow up to 10 concurrent sockets (requests)
      maxFreeSockets: 6,         // Allow up to 5 idle sockets to remain open
      //keepAliveMsecs: 50000,
});

//Headers for Axios request
const axiosConfig = {
     httpsAgent: agent,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/131.0",
        'Connection': 'keep-alive',
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8;",
        "Priority": "u=0"
    },
    // timeout: 30000,
     
};

const validationHeader = {
    httpsAgent: agent,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/131.0',
    },
     withCredentials: true,
//    timeout: 20000
};

// Setting extracted cookies in header format
const cookieHeader =`XSRF-TOKEN=${xsrfToken}; ivac_session=${ivacSession}`;

// Set cookies  in headers validation Headers
validationHeader.headers['Cookie'] = cookieHeader;

// Set XSRF token in axios headers
axiosConfig.headers['Cookie'] = cookieHeader;
axiosConfig.headers['X-XSRF-TOKEN'] = xsrfToken;


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
var expected_date = "2024-10-30"; //nextDate;

let application = [
     { web_file: "BGDDW1AE3424", applicant_name: "PAKHI RANI ROY" },
     { web_file: "BGDDW1AE3D24", applicant_name: "SUKAMAL ROY" }
];    


var mobile="01624389711";
var email = "shuvo.ezzyr@gmail.com";

var MainCenterId = 1; // Dhaka 1 , Chittagong 2, Rajshahi 3,Sylhet 4, KHULNA 5
var VisaCenterId = 17;  //DHaka 17, JESSORE 12, KHULNA 19
var VisaTypeId = 13; // MEDICAL VISA 13 // ENTRY VISA 6 // TOURIST VISA 3

// funtion processing Variable;

let isOtpSendRequestStop = false;
let isOtpVerifyRequestStop = false;
let isGetOtpRequestInProgress = false;
let isOtpRequestInProgress = false;
let isSlotTimeRequestStop = false;
let isFinalPayNowRequestStop = false;
let isOtpReceived = false;

let timeoutId; // set timeout id;
let setProcessTimeoutId; // set timeout id;
const setProcessTimeouts = []; // Array to store timeout IDs

let otherBatchTimeoutId; // set timeout id;
const otherBatchTimeouts = []; // Array to store timeout IDs

let validationTimeoutId = null;
let fetchOtpTimeoutId = null;
let payNowtimeoutId = null;

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
    //link: "https://securepay.sslcommerz.com/gwprocess/v4/image/gw1/bkash.png",
  };


let otpKey=filesInfo.payment[0].web_id+'-'+expected_date+'-otp';
let selectedSlotKey=filesInfo.payment[0].web_id+'-'+expected_date+'-slot';
let otpVerifiedKey=filesInfo.payment[0].web_id+'-'+expected_date+'-otpVerified';
  
let checkOtpGet=getItem(otpKey);
let checkSelectedSlot=getItem(selectedSlotKey);
let checkOtpVerify=getItem(otpVerifiedKey);
  

if(checkSelectedSlot!==undefined){
    selected_slot=checkSelectedSlot;
    checkGetTimeSlot=true;

}

ReceivedOTP=(checkOtpGet!==undefined) ? checkOtpGet:"";

isOtpVerified=(checkOtpVerify!==undefined) ? checkOtpVerify:false;
  
// Function to get an object by name
function getObjectByName(objectArray,id) {
    return objectArray.find(obj => obj.id === id);
}

function getRandomDelay() {
    const randomDelay = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
    return randomDelay;
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

    try {

        const response = await axios.post(payNowUrl, payNowSubmitData,axiosConfig);

        const resp = response.data;

        updateStatusMessage('finalPayMSG',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' );

        if (resp.status ===	"FAIL") {

            var error_reason=(typeof resp?.errors !== 'undefined') ? resp.errors: "Pay Now Data response error.Resending...";
            
            if (error_reason=="Mobile no is not verified with this requested webfiles" || error_reason=="OTP not found with this mobile number") {
                updateStatusMessage('finalPayMSG',error_reason);
            }else if (error_reason==" Available slot is less than zero" || error_reason=="Available slot is less than zero"){
                updateStatusMessage('finalPayMSG', error_reason);
                 payNowtimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
            }
            else{
                updateStatusMessage('finalPayMSG',error_reason);
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, getRandomDelay);
            }

        }else if (resp.status !=="FAIL") {

            if(typeof resp.data?.status !== 'undefined'){
                 
                if(resp.data.status === 'OK' && typeof resp.data?.url !== 'undefined') {
                    
                        isFinalPayNowRequestStop=true;

                        clearTimeout(payNowtimeoutId);
                        
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

    if (isSlotTimeRequestStop) {
        updateStatusMessage('timeSlotMsg', 'TIme Slot Request stoped Successfully');
        return;
    }

    if (checkGetTimeSlot) {
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

    try {
        const response = await axios.post(timeSlotUrl, timeSlotPostData, axiosConfig);

        const resp = response.data;

            if (resp.status=='OK' && resp.slot_times.length===0) {

                updateStatusMessage('timeSlotMsg', 'Time slot not available in this time.Resending...');
                
                setProcessTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
                setProcessTimeouts.push(setProcessTimeoutId);

            }else if(resp.status=='OK' && resp.slot_times.length!==0){

                    updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                    //Stop sending Request
                    setProcessTimeouts.forEach(clearTimeout);

                    selected_slot = resp.slot_times[0];
                    filesInfo.payment[0].appointment_time = selected_slot.hour;
                    
                    isSlotTimeRequestStop = true;
                    checkGetTimeSlot=true;

                    SaveTimeSlot(resp.slot_times);
                
                    setItem(selectedSlotKey, selected_slot);
                
                updateStatusMessage('timeSlotMsg', "AvailableSlot :" + selected_slot.availableSlot + " Selected Time: " + selected_slot.time_display, 'success');
                
                 if (checkGetTimeSlot && isOtpVerified) {
                     otherBatchTimeouts.forEach(clearTimeout);
                     isOtpVerifyRequestStop = true;

                    updateStatusMessage('timeSlotMsg','Sending final PayNow request....');
                    FinalPayNowV2Request();
                }
                    

            } else {
                updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                updateStatusMessage('timeSlotMsg', 'Time Slot is Empty! Resending Request...');
                setProcessTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
                setProcessTimeouts.push(setProcessTimeoutId);
            }    

    } catch (error) {

        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('timeSlotMsg', error.response.status +' Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
                updateStatusMessage('timeSlotMsg',error.response.status + ' Gateway timeout! Resending Request');
            }else{
                updateStatusMessage('timeSlotMsg', 'An error occurred: ' + error.message);
                console.log('Error:', error.message);
            }
        }
        updateStatusMessage('timeSlotMsg', 'Time slot request server error. Resending request....');
        setProcessTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
        setProcessTimeouts.push(setProcessTimeoutId);
    }
}

// Function to handle OTP verification
const sendVerifyOtpRequest = async () => {
    
    if (isOtpVerifyRequestStop) {
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
    
    try {
        // Send POST request with Axios
        const response = await axios.post(otpSendUrl, otpVerifyData, axiosConfig);

        const resp = response.data;

        if (resp.status ===	"FAILED" && resp.code === 422) {
            
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
            var error_reason = resp.data.error_reason;
            
            setProcessTimeouts.forEach(clearTimeout);
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
               
                otherBatchTimeouts.forEach(clearTimeout);
                isOtpVerifyRequestStop = true;
                isOtpVerified==true;
                
                updateStatusMessage('otpVerifyMsg','OTP Not Found Mobile Number.Request Verified Successfully','success');
       
                if (checkGetTimeSlot && isOtpVerified) {
                    setProcessTimeouts.forEach(clearTimeout);
                    isSlotTimeRequestStop = true;

                    updateStatusMessage('timeSlotMsg','Sending final PayNow request....');
                    FinalPayNowV2Request();
                }


            }else {
                updateStatusMessage('otpVerifyMsg',error_reason);
                // timeoutId = setTimeout(sendVerifyOtpRequest, 500);
                // timeouts.push(timeoutId);
            }

        }else if (resp.status ==="SUCCESS" && resp.code === 200){
    
                setProcessTimeouts.forEach(clearTimeout);
                isOtpVerifyRequestStop = true;
                isOtpVerified==true;
                
                updateStatusMessage('otpVerifyMsg','OTP Verified Successfully.','success');
       
                if (checkGetTimeSlot && isOtpVerified) {
                        setProcessTimeouts.forEach(clearTimeout);
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

        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('otpVerifyMsg', error.response.status +' Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
                updateStatusMessage('otpVerifyMsg',error.response.status + ' Gateway timeout! Resending Request');
            }else{
                updateStatusMessage('otpVerifyMsg', 'Error : ' + error.message);
            }
        }
        otherBatchTimeoutId = setTimeout(getDateTimeSlotRequest, getRandomDelay);
        otherBatchTimeouts.push(otherBatchTimeoutId);
      
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

        isOtpRequestInProgress = false;
        // Handle different response scenarios
        if (resp.status === "FAILED" && resp.code === 422) {
            updateStatusMessage('otpSendMsg', 'Slot is not available to send OTP. Retrying...');
            //timeoutId = setTimeout(sendOtpPostRequest, 200);

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
        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('otpSendMsg', error.response.status +' Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
                updateStatusMessage('otpSendMsg',error.response.status + ' Gateway timeout! Resending Request');
            }else{
                updateStatusMessage('otpSendMsg', 'An error occurred: ' + error.message);
            }
        }
        // updateStatusMessage('otpSendMsg', 'OTP send request Server Error.resending....');


        //console.log(error.response);
        
        timeoutId = setTimeout(sendOtpPostRequest, getRandomDelay);
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

                otherBatchedRequests(sendVerifyOtpRequest);

            } else {
                // Handle invalid OTP
                updateStatusMessage('OTPGet','OTP Received Successfully. OTP Invalid: ' + resp.data.otp);

                fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1500);
            }

        } else {
            updateStatusMessage('OTPGet','OTP is empty or undefined. Retrying...');
            
                fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1500);
        }

    } catch (error) {
        // Handle error
        isGetOtpRequestInProgress = false;
        updateStatusMessage('OTPGet','Error fetching OTP. Retrying...'+error);
        fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1500); // Retry after 1 second
    }   
}

//batch request sending

const sendBatchedRequests = async (sendRequest)=>{
    
    const numberOfBatchedRequests = 5; // Total number of requests
    const initialDelay = 100; // Initial delay in milliseconds

    for (let i = 0; i < numberOfBatchedRequests; i++) {
        const delay = initialDelay + i * 50; // Calculate the delay

        // console.log('Time slot batch Request sending:'+i);

        setProcessTimeoutId = setTimeout(() => {
            sendRequest(i); // Call sendRequest with the current index
        }, delay);

        setProcessTimeouts.push(setProcessTimeoutId); // Store the timeout ID
    }
}


const otherBatchedRequests = async (sendRequest)=>{
    
    const numberOfBatchedRequests = 5; // Total number of requests
    const initialDelay = 100; // Initial delay in milliseconds

    for (let i = 0; i < numberOfBatchedRequests; i++) {
        const delay = initialDelay + i * 50; // Calculate the delay

        // console.log('Time slot batch Request sending:'+i);

        otherBatchTimeoutId = setTimeout(() => {
            sendRequest(i); // Call sendRequest with the current index
        }, delay);

        otherBatchTimeouts.push(otherBatchTimeoutId); // Store the timeout ID
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

            updateStatusMessage('Start', '\n Request For Date Slot and Otp Send ...');
            console.log('STARTING REQUEST OTP SENDING'); 
            sendOtpPostRequest();
            getOtpFromApi();
            sendBatchedRequests(getDateTimeSlotRequest);
            
        } else {
            console.clear();
            console.log(`Date Release Time Not Yet ... Current Time: ${currentTime}`);
        }
    }, 1000); // Check every second
}


// Function to get session cookies from the website
async function getSessionCookies() {
    try {
        const response = await axios.get('https://payment.ivacbd.com', {
            withCredentials: true, // Include credentials (cookies) in requests
        });

       
         // Capture and set cookies from the response headers
        if (response.headers['set-cookie']) {

            // Extracted cookies
           let cookiesArray = response.headers['set-cookie'];
            // Extract keys and values with specific naming

            // Extract keys and values without any replacement
            const extractedCookies = cookiesArray.map((cookie, index) => {
                const parts = cookie.split(';')[0].split('='); // Split on first '=' to get key-value pair
                const key = index === 0 ? 'xtoken' : 'session'; // Rename keys based on index
                return {
                    key: key,
                    value: parts[1] // Take the value without any modifications
                };
            });

            // Create an object for easy access
            const cookies = {
                xtoken: extractedCookies[0].value, // Get the value for xtoken
                session: extractedCookies[1].value // Get the value for session
            };
           // console.log(cookieValues);
            //const xsrfToken = getCookieValue(setCookieArray[0], 'XSRF-TOKEN');
            //const ivacSession = getCookieValue(setCookieArray[1], 'ivac_session');


            // let xsrfToken = "eyJpdiI6Ikp1cVpuODNZUTRVcE4yNUJmNEtqRUE9PSIsInZhbHVlIjoiVHVsME8wTkZ1cm5kbFhBa2F1T2Y5bDU0Z0dsUkhiOUEyNUhDOXk0WWZsUFlxd0g1dk5lZ3Bpc2NKYnVUZ2twayIsIm1hYyI6ImRhODYzZDkzYjM1ZTIzYjY3YzIyOWNmODY2ZWY0YjllMmUzMzYyNGM3MmMxZTE3NjBjMjFkYjFjNzkyYWNmNmMifQ%3D%3D";
            // let ivacSession ="eyJpdiI6IjRDRDRNSHdHbms3RmhQaWNXU3ppR2c9PSIsInZhbHVlIjoiOFwvREhcL2VFbWxHNmVlUnV1YlwvT3NyazVDNjdTNzFncjhpdnQxbEFzbllvdWtcL0tLbFFoOTlcL3JLbVhqWlJ2OEtCIiwibWFjIjoiMDNmZTI4ZmVjN2JlNjJkNTVmM2FkZWVhY2RlMGE1ZjkyNWNiY2M4NzMwMjIwNTBhYmZjMWU5YzViM2JhNWU2ZiJ9eyJpdiI6IkdjWURHeDJFRllIY2pmaHIxdzRuU1E9PSIsInZhbHVlIjoiUHNnTnRNYTJJYkhwUmp2Q3p4aUZkempvZXdoRFU0MUV6d3o4U2o3b3JOUTQ0SFNYcFpLOURON3dXY1VkSVBVMiIsIm1hYyI6IjkxZTZkZDFhNzAxMDgxOWNlYWQ1NDgxNTA5NTZkODg5NDUzNjRiNzIzNTM4MTNhN2M3M2I2NzFkMjUzZjA2MzUifQ%3D%3D";
            
            // Setting extracted cookies in header format
            const cookieHeader = cookiesArray; //`XSRF-TOKEN=${cookies.xtoken}; ivac_session=${cookies.session}`;

            // Set cookies  in headers validation Headers
            validationHeader.headers['Cookie'] = cookieHeader;

            // Set XSRF token in axios headers
            axiosConfig.headers['Cookie'] = cookieHeader;
            axiosConfig.headers['X-XSRF-TOKEN'] = cookies.xtoken;

            console.log('Cookies Set Successfully');

            validateApplication();

           // console.log(axiosConfig.headers);

            //console.log(response.headers['set-cookie']);
            
           // console.log(axiosConfig.headers);
        


        }

    } catch (error) {
        console.error('Error fetching session cookies:', error);
        validationTimeoutId = setTimeout(getSessionCookies, 1000); // Retry after 1 second
    }
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
            clearTimeout(validationTimeoutId);
            completeSteps(); // Ensure to await the completion of steps
        }
    } catch (error) {
        // Handle error
        updateStatusMessage('FileValidation', 'FileValidation Server error. Retrying...' + error);
        validationTimeoutId = setTimeout(validateApplication, getRandomDelay); // Retry after 1 second
    }
}

async function completeSteps() {
    for (let step = 2; step <= 4; step++) {
        try {
            const response = await axios.get(`${apiBaseUrl}/payment/check-step/${step}`, validationHeader);
            console.log('Payment Check Response:', response.data); // Log the full response for debugging
            
            if (response.data === false || response.data === 'false') {
                updateStatusMessage('FileValidation', `File Verify Step ${step} Completed successfully`);
                if (step === 4) {
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
        
        if (resp.success == true) {
            console.log("slot Save Response: " + JSON.stringify(resp));
            updateStatusMessage('FileValidation', `Collected Slot Saved To Storage Successfullly`,'Success');
        }

    } catch (error) {
         // Retry if we get a 504, 502, or 503 error (gateway timeout/server overload)

        if (error.response && [504, 502, 503].includes(error.response.status)) {
             console.log('Slot Error'+ error + ' Gateway timeout! Resending Request');
        } else {
              console.log('Slot Error'+ error + ' Gateway timeout! Resending Request');
        }

        setTimeout(SaveTimeSlot, 1000); // Retry after 200ms for other errors
    };
};


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
validateApplication();

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