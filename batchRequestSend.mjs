import axios from 'axios';
import qs from 'qs';
import { exec } from 'child_process';
import https from 'https';
import fs from 'fs';

// Apply the HTTP/2 adapter globally for Axios
//axios.defaults.adapter = http2Adapter;

const agent = new https.Agent({
      keepAlive: true,           // Keep connection alive
      maxSockets: 10,            // Allow up to 10 concurrent sockets (requests)
      maxFreeSockets: 5,         // Allow up to 5 idle sockets to remain open
      keepAliveMsecs: 50000,
});

// Headers for Axios request
const axiosConfig = {
    httpsAgent: agent,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    timeout: 5000
};


// Set CSRF token  &&  API key
let csrfToken, apiKey;

csrfToken= apiKey= "H0VvZHtgxl364wy9ouVdhH7OL7joK2iGId8fY0Lu";
// Import axios-retry

// Set base URL for API requests
const apiBaseUrl = 'https://payment.ivacbd.com';


// Set API endpoints
const otpSendUrl = `${apiBaseUrl}//api/v1/queue-manage`;
const timeSlotUrl = `${apiBaseUrl}/api/get_payment_options_v2`;
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
var expected_date=nextDate;
var web_file="BGDDW1477724";
var applicant_name="SHAHARIAR HOSSAIN MUKUL";
var mobile="01829006154";
var email= "pakkna@gmail.com";
var my_visa_type= "ENTRY VISA" //"ENTRY VISA"

// funtion processing Variable;

let isOtpSendRequestStop = false;
let isOtpVerifyRequestStop = false;
let isGetOtpRequestInProgress = false;
let isOtpRequestInProgress = false;
let isOtpVerifyRequestInProgress = false;
let isSlotTimeRequestStop = false;
let isFinalPayNowRequestStop = false;
let isOtpReceived = false;

let timeoutId; // set timeout id;
let setProcessTimeoutId; // set timeout id;
const setProcessTimeouts = []; // Array to store timeout IDs

let fetchOtpTimeoutId = null;
let payNowtimeoutId = null;

let isOtpVerified = false;
let checkGetTimeSlot = false;
let resendOtp=0;
let ReceivedOTP="";
let selected_slot ="";

// VIsa Type array of objects
const VisaTypeArray = [
    { id: 1, type_name: "TOURIST VISA", order: 1, is_active: 1 },
    { id: 13, type_name: "MEDICAL/MEDICAL ATTENDANT VISA", order: 2, is_active: 1},
    { id: 2, type_name: "STUDENT VISA", order: 6, is_active: 1 },
    { id: 6, type_name: "ENTRY VISA", order: 5, is_active: 1}
];

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
            center: {
                id: "1",
                c_name: "Dhaka",
                prefix: "D",
            },
            is_open: "true",
            ivac: {
                id: 17,
                center_info_id: 1,
                ivac_name: "IVAC, Dhaka (JFP)",
                prefix: "D",
                visa_fee: "800.00",
                app_key: "IVACJFP",
                charge: "3"
            },
            visa_type: getObjectByName(my_visa_type, VisaTypeArray),
            confirm_tos: "true",
            appointment_time:expected_date,
            otp:ReceivedOTP,
        }
    ],
};


let selected_payment={
    name: "Bkash",
    slug: "bkash",
    grand_total: 824,
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
function getObjectByName(name,objectArray) {
    return objectArray.find(obj => obj.type_name === name);
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
                updateStatusMessage('finalPayMSG',error_reason);
            }
            else{
                updateStatusMessage('finalPayMSG',error_reason);
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, 500);
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
                    payNowtimeoutId = setTimeout(FinalPayNowV2Request, 300);
                }        

            }else{
               
                updateStatusMessage('finalPayMSG','Failed to verify response data! Resending Request...');
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, 300);
            }   

        }else{
            updateStatusMessage('finalPayMSG','Response data invalid! Resending Request...');
            payNowtimeoutId = setTimeout(FinalPayNowV2Request, 300);
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
        payNowtimeoutId = setTimeout(FinalPayNowV2Request, 300);
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
                
                setProcessTimeoutId = setTimeout(getDateTimeSlotRequest, 300);
                setProcessTimeouts.push(setProcessTimeoutId);

            }else if(resp.status=='OK' && resp.slot_times.length!==0){

                    updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                    //Stop sending Request
                    setProcessTimeouts.forEach(clearTimeout);

                    selected_slot = resp.slot_times[0];
                    filesInfo.payment[0].appointment_time = selected_slot.hour;
                    
                    isSlotTimeRequestStop = true;
                    checkGetTimeSlot=true;

                    setItem(selectedSlotKey,selected_slot);

                    updateStatusMessage('Selected Date: ',JSON.stringify(selected_slot, null, 2),'\x1b[32m%s\x1b[0m' ); //log selected_date data

                    console.log("AvailableSlot :"+selected_slot.availableSlot+" Selected Time: "+selected_slot.time_display);
                    updateStatusMessage('timeSlotMsg',"AvailableSlot :"+selected_slot.availableSlot+" Selected Time: "+selected_slot.time_display);
                    

            } else {
                updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                updateStatusMessage('timeSlotMsg', 'Time Slot is Empty! Resending Request...');
                setProcessTimeoutId = setTimeout(getDateTimeSlotRequest, 300);
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
        updateStatusMessage('timeSlotMsg', 'Resending time slot request ....');
        setProcessTimeoutId = setTimeout(getDateTimeSlotRequest, 300);
        setProcessTimeouts.push(setProcessTimeoutId);
    }
}

// Function to handle OTP verification
const sendVerifyOtpRequest = async()=> {
    if (isOtpVerifyRequestInProgress) {
        updateStatusMessage('otpVerifyMsg','OTP Verify Request in progress, please wait...');
        return;
    } else if (isOtpVerifyRequestStop) {
          updateStatusMessage('otpVerifyMsg','OTP Verify Request Stoped Successfully');
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
    
    try {
        // Send POST request with Axios
        const response = await axios.post(otpSendUrl, otpVerifyData, axiosConfig);

        const resp = response.data;

        isOtpVerifyRequestInProgress = false;

        if (resp.status ===	"FAILED" && resp.code === 422) {
            
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
            var error_reason=resp.data.error_reason;

            if (error_reason=="Mobile no is not verified with this requested webfiles" || error_reason=="OTP not found with this mobile number" ||  error_reason=="OTP expired. Please try again" || error_reason=="OTP does not match. Please try again") {
               
                if(ReceivedOTP.length == 6){
                    updateStatusMessage('otpVerifyMsg',error_reason+'.Resending...');
                    clearTimeout(timeoutId);
                    //ReceivedOTP="";
                    //resendOtp=1;
                   // sendOtpPostRequest();
                }else{
                    updateStatusMessage('otpVerifyMsg','Otp length is not valid.Fetching New OTP...');

                    if (ReceivedOTP=="" || ReceivedOTP.length != 6) {
                        fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1500);
                    }
                } 
            }else{
                updateStatusMessage('otpVerifyMsg',error_reason);
                // timeoutId = setTimeout(sendVerifyOtpRequest, 500);
                // timeouts.push(timeoutId);
            }

        }else if (resp.status ==="SUCCESS" && resp.code === 200){
    
                    updateStatusMessage('otpVerifyMsg','OTP Verified Successfully.','\x1b[32m%s\x1b[0m');
                    updateStatusMessage('timeSlotMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                    isOtpVerifyRequestStop=true;
                    isOtpVerified==true;
                    clearTimeout(timeoutId);
                   
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
        isOtpVerifyRequestInProgress = false;

        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('otpVerifyMsg', error.response.status +' Gateway timeout! Resending Request');
            }else if(error.response.status === 403){
                updateStatusMessage('otpVerifyMsg',error.response.status + ' Gateway timeout! Resending Request');
            }else{
                updateStatusMessage('otpVerifyMsg', 'An error occurred: ' + error.message);
                console.log('Error:', error.message);
            }
        }
        timeoutId = setTimeout(sendVerifyOtpRequest, 200);
      
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
            timeoutId = setTimeout(sendOtpPostRequest, 200);

        } else if (resp.status == "SUCCESS" && resp.code === 200) {

            updateStatusMessage('otpSendMsg', 'OTP Sent Successfully. Finding OTP....','\x1b[32m%s\x1b[0m');
            updateStatusMessage('otpSendMsg',JSON.stringify(resp, null, 2),'\x1b[34m%s\x1b[0m' ); //log response data
            
            //Stop sending Request
            clearTimeout(timeoutId);
            isOtpSendRequestStop=true;
            // Function to get OTP from API
            
            if (ReceivedOTP == "") {
                getOtpFromApi();
            }
            

        } else {
            timeoutId = setTimeout(sendOtpPostRequest, 200);
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
                console.log('Error:', error.message);
            }
        }    
        
        timeoutId = setTimeout(sendOtpPostRequest, 200);
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
                ReceivedOTP=resp.data.otp;
                
                setItem(otpKey,ReceivedOTP);
                
                isOtpSendRequestStop = true;

                //Stop sending Request
                clearTimeout(timeoutId);

                clearTimeout(fetchOtpTimeoutId);

                sendVerifyOtpRequest();

                // Display success message

                updateStatusMessage('OTPGet','OTP Received Successfully. OTP Received: ' + resp.data.otp,'\x1b[32m%s\x1b[0m');

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

        console.log('Time slot batch Request sending:'+i);

        setProcessTimeoutId = setTimeout(() => {
            sendRequest(i); // Call sendRequest with the current index
        }, delay);

        setProcessTimeouts.push(setProcessTimeoutId); // Store the timeout ID
    }
}


 // date selection request
sendBatchedRequests(getDateTimeSlotRequest);
 //otp send request
sendOtpPostRequest();

getOtpFromApi();

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