//const puppeteer = require('puppeteer');
const axios = require('axios');
const qs = require('qs');
const { exec } = require('child_process');
// Import axios-retry

// Set CSRF token  &&  API key
let csrfToken, apiKey;

csrfToken= apiKey= "7LjMzM1LS8bVe5VlGrpbpdZqTnSDIUEmq0bDDBS5";
// Import axios-retry

// Set base URL for API requests
const apiBaseUrl = 'https://payment.ivacbd.com';

// Set API endpoints
const otpSendUrl = `${apiBaseUrl}/api/v1/queue-manage`;
const timeSlotUrl = `${apiBaseUrl}/api/get_payment_options_v2`;
const payNowUrl = `${apiBaseUrl}/slot_pay_now`;

//Date Release time
const targetTime = '10:00:01'; // Target time in HH:mm:ss format

// data info variables
var expected_date="2024-10-18";
var web_file="BGDDW1477724";
var applicant_name="SHAHARIAR HOSSAIN MUKUL";
var mobile="01784492297";
var email= "pakkna@gmail.com";
var my_visa_type= "ENTRY VISA" //"ENTRY VISA"

// funtion processing Variable;
let checkOtpVerified = false;
let checkGetTimeSlot = false;
let getTimeSlotIsLoading = false;
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
let lastSlotRequestTime = null;
let checkOtpVerfied=false;
let resendOtp=0;
let ReceivedOTP=null;


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
            passport: "",
            name: applicant_name,
            phone: mobile,
            email: email,
            amount: "800.00",
            captcha: "",
            center: {
                id: "1",
                c_name: "Dhaka",
                prefix: "D",
                is_delete: "0"
            },
            is_open: "true",
            ivac: {
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
            },
            visa_type: getObjectByName(my_visa_type, VisaTypeArray),
            confirm_tos: "true",
            otp:null,
        }
    ],
};


let selected_payment={
    name: "Bkash",
    slug: "bkash",
    grand_total: 824,
    link: "https://securepay.sslcommerz.com/gwprocess/v4/image/gw1/bkash.png",
  };

let selected_slot={};


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


// Headers for Axios request
const axiosConfig = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    }
};


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

    // // start to get token and api key by Browser
    // (async () => {
    //     const browser = await puppeteer.launch({ headless: true });
    //     const page = await browser.newPage();
       
    //     let errorMessages = ""; // Variable to store error messages
    
    //     console.log("====== STARTING To RETRIEVE CSRF Token & API Key ======\n");
    //     console.log("Attempting to retrieve CSRF token and API key...\n");
    
    //     while (true) {
    //         try {
    //             console.log("Step 1: Waiting for the server response...");
    
    //             // Navigate to the URL
    //             const response = await page.goto('https://payment.ivacbd.com/', { waitUntil: 'networkidle2' });
    //             console.log("Step 2: Server responded.\n");
    
    //             // Get CSRF token
    //             const csrfToken = await page.evaluate(() => window.csrf_token);
    
    //             // Get apiKey from AngularJS filesInfo
    //             const apiKey = await page.evaluate(() => {
    //                 var scopeElement = angular.element(document.querySelector('[ng-controller="payment_application"]'));
    //                 var scope = scopeElement.scope();
    //                 return scope.apiKey;
    //             });
    
    //             if (csrfToken && apiKey) {
    //                 console.clear(); // Clear the console including any previous errors
    //                 console.log("====== STARTING To RETRIEVE CSRF Token & API Key ======\n");
    //                 console.log(`Step 3: CSRF Token : ${csrfToken}\n`);
    //                 console.log(`Step 4: API Key : ${apiKey}\n`);
    //                 console.log("====== CSRF TOKEN & API KEY SUCCESSFULLY RETRIEVED ======");
    //                 break; // Exit the loop once both values are retrieved
    //             } else {
    //                 throw new Error('CSRF token or API key not found.');
    //             }
    
    //         } catch (error) {
    //             errorMessages += `Attempt failed. Error: ${error.message}.\n`; // Append errors to errorMessages
    //             console.clear(); // Clear previous logs
    //             console.log(errorMessages); // Show accumulated error messages
    //             console.log("Retrying in 2 seconds...\n");
    //             await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 2 seconds before retrying
    //         }
    //     }
    
    //     // Close the browser after successful retrieval
    //     await browser.close();
    
    //     // Wait for user input to proceed
    //     await new Promise(resolve => process.stdin.once('data', resolve));
    //     scheduleOtpRequest(targetTime);
       

    // })();



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

    try {

        const response = await axios.post(payNowUrl, payNowSubmitData, axiosConfig);
        const resp = response.data;

        isFinalPayNowRequestInProgress = false;

        updateStatusMessage('finalPayMSG',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' );

        if (resp.status ===	"FAIL") {

            var error_reason=(typeof resp?.errors !== 'undefined') ? resp.errors: "Pay Now Data response error.Resending...";
            
            if (error_reason=="Mobile no is not verified with this requested webfiles" || error_reason=="OTP not found with this mobile number") {
                updateStatusMessage('finalPayMSG',error_reason);
            }else{
                updateStatusMessage('finalPayMSG',error_reason);
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, 100);
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
                    payNowtimeoutId = setTimeout(FinalPayNowV2Request, 100);
                }        

            }else{
               
                updateStatusMessage('finalPayMSG','Failed to verify response data! Resending Request...');
                payNowtimeoutId = setTimeout(FinalPayNowV2Request, 100);
            }   

        }else{
            updateStatusMessage('finalPayMSG','Response data invalid! Resending Request...');
            payNowtimeoutId = setTimeout(FinalPayNowV2Request, 100);
        }

        
    } catch (error) {
        isFinalPayNowRequestInProgress = false;
        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('finalPayMSG', 'Gateway timeout! Resending Request');
            } else {
                updateStatusMessage('finalPayMSG', 'An error occurred: ' + error.message);
            }
        }
        payNowtimeoutId = setTimeout(FinalPayNowV2Request, 100);
    }
}

// Function to handle slot time request with caching
async function getDateTimeSlotRequest() {

    if (isSlotTimeRequestInProgress) {
        updateStatusMessage('timeSlotMsg', 'Request in progress, waiting for completion...');
        return;
    }

    if (checkGetTimeSlot) {
        updateStatusMessage('timeSlotMsg','Already Selected:'+selected_slot);
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

    try {
        const response = await axios.post(timeSlotUrl, timeSlotPostData, axiosConfig);

        const resp = response.data;

        isSlotTimeRequestInProgress = false;

            if (resp.status=='OK' && resp.slot_times.length===0) {

                 updateStatusMessage('timeSlotMsg', 'Time slot not available in this time.Resending...');
                 dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, 100);
            }else if(resp.slot_times.length!==0){

                    selected_slot = resp.slot_times[0];
                    filesInfo.payment[0].appointment_time = selected_slot.hour;
                    
                    checkGetTimeSlot = true;
                    getTimeSlotIsLoading = false;
                
                    console.log("Selected Slot: "+selected_slot);
                    updateStatusMessage('timeSlotMsg','Time slot found successfully [' + selected_slot.time_display+']');
                    

            }else{
                updateStatusMessage('timeSlotMsg', 'Time Slot is Empty! Resending Request...');
                dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, 100);
            }    

    } catch (error) {
        isSlotTimeRequestInProgress = false;

        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('timeSlotMsg', 'Gateway timeout! Resending Request');
            } else {
                updateStatusMessage('timeSlotMsg', 'An error occurred: ' + error.message);
            }
        }   
        
        dateSlotTimeoutId = setTimeout(getDateTimeSlotRequest, 100);
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

    try {
        // Send POST request with Axios
        const response = await axios.post(otpSendUrl, otpVerifyData, axiosConfig);

        const resp = response.data;

        isOtpVerifyRequestInProgress = false;

        if (resp.status ===	"FAILED") {
            
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
            var error_reason=resp.data.error_reason;

            if (error_reason=="Mobile no is not verified with this requested webfiles" || error_reason=="OTP not found with this mobile number" ||  error_reason=="OTP expired. Please try again" || error_reason=="OTP does not match. Please try again") {
               
                if(ReceivedOTP.length == 6){
                    updateStatusMessage('otpVerifyMsg',error_reason+'.Resending...');
                    clearTimeout(timeoutId);
                    filesInfo.payment[0].otp=null;
                    ReceivedOTP=null;
                    resendOtp=1;
                    sendOtpPostRequest();
                }else{
                    updateStatusMessage('otpVerifyMsg','Otp length is not valid.Fetching New OTP...');

                    if (ReceivedOTP==null && ReceivedOTP.length != 6) {
                        timeoutId = setTimeout(getOtpFromApi, 1000);
                    }
                } 
            }else if(error_reason=='Slot is not available'){
                updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' ); //log response data
                updateStatusMessage('otpVerifyMsg','Slot is not available.Sending New OTP...');
                sendOtpPostRequest();
                
            }else{
                updateStatusMessage('otpVerifyMsg',error_reason);
                timeoutId = setTimeout(sendVerifyOtpRequest, 100);
            }

        }else if (resp.status !=="FAILED") {
            
            updateStatusMessage('otpVerifyMsg',JSON.stringify(resp, null, 2),'\x1b[32m%s\x1b[0m' );

             // var DateSlots= resp.data.slot_dates;
           
                if (expected_date.length!==0) {
                    filesInfo.appointment_date = expected_date; //DateSlots[0];
                    updateStatusMessage('otpVerifyMsg','OTP Verified Successfully.','\x1b[32m%s\x1b[0m');
                   
                    if (checkGetTimeSlot) {
                        clearTimeout(timeoutId);
                        updateStatusMessage('otpVerifyMsg','Sending final PayNow request....');
                        FinalPayNowV2Request();
                    }
                }else{
                    updateStatusMessage('otpVerifyMsg','fetched slots: '+DateSlots);
                    timeoutId = setTimeout(sendVerifyOtpRequest, 100);
                }

        }else{
            updateStatusMessage('otpVerifyMsg','Failed to connect verify otp! Resending Request...');
            timeoutId = setTimeout(sendVerifyOtpRequest, 100);
        } 
        
        
    } catch (error) {
        isOtpVerifyRequestInProgress = false;
        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('otpVerifyMsg', 'Gateway timeout! Resending Request');
            } else {
                updateStatusMessage('otpVerifyMsg', 'An error occurred: ' + error.message);
                console.log('Error:', error.message);
            }
        }
        timeoutId = setTimeout(sendVerifyOtpRequest, 100);
      
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

    try {
        // Send POST request with Axios
        const response = await axios.post(otpSendUrl, OtpSendPostData,axiosConfig);

        const resp = response.data;
        isOtpRequestInProgress = false;
          
    
        // Handle different response scenarios
        if (resp.status === "FAILED" && resp.code === 422) {
           updateStatusMessage('otpSendMsg', 'Slot is not available to send OTP. Retrying...');
           timeoutId = setTimeout(sendOtpPostRequest, 100);

        } else if (resp.status == "SUCCESS" && resp.code === 200) {

            updateStatusMessage('otpSendMsg', 'OTP Sent Successfully. Finding OTP....','\x1b[32m%s\x1b[0m');
            updateStatusMessage('otpSendMsg',JSON.stringify(resp, null, 2),'\x1b[34m%s\x1b[0m' ); //log response data
            
            //Stop sending Request
            clearTimeout(timeoutId);
           // Function to get OTP from API
            getOtpFromApi();  

        } else {
            timeoutId = setTimeout(sendOtpPostRequest, 100);
            updateStatusMessage('otpSendMsg',  resp.data.error_reason);
        }

    } catch (error) {
        isOtpRequestInProgress = false;
        if(error.response){
            if (error.response.status === 504|| error.response.status === 502) {  // Gateway timeout
                updateStatusMessage('otpSendMsg', 'Gateway timeout! Resending Request');
            }
        }else{
                updateStatusMessage('otpSendMsg', 'An error occurred: ' + error.message);
                console.log('Error:', error.message);
        }
       
        timeoutId = setTimeout(sendOtpPostRequest, 100);
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
        },axiosConfig);

        // Handle the successful response
        const resp = response.data;
        isGetOtpRequestInProgress = false;
        
        if (resp.success && resp.data.otp !== '') {

            if (resp.data.otp.length == 6) {
                filesInfo.payment[0].otp = resp.data.otp;
                ReceivedOTP=resp.data.otp;
                isOtpReceived = true;
                clearTimeout(fetchOtpTimeoutId);

                FinalPayNowV2Request();
                //sendVerifyOtpRequest();
                // Display success message

                updateStatusMessage('OTPGet','OTP Received Successfully. OTP Received: ' + resp.data.otp,'\x1b[32m%s\x1b[0m');
            } else {
                // Handle invalid OTP
                updateStatusMessage('OTPGet','OTP Received Successfully. OTP Invalid: ' + resp.data.otp);

                if (filesInfo.payment[0].otp == null || ReceivedOTP==null) {
                    fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1000);
                }
            }

        } else {
            updateStatusMessage('OTPGet','OTP is empty or undefined. Retrying...');
            if (filesInfo.payment[0].otp== null || ReceivedOTP==null) {
                fetchOtpTimeoutId = setTimeout(getOtpFromApi, 1000);
            }
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
            console.log(`Date Release Time Not Yet ... Current Time: ${currentTime}`);
        }
    }, 1000); // Check every second
}

scheduleOtpRequest(targetTime);