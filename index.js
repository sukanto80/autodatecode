const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

// List of random proxies (replace with your own or use a proxy provider)
const proxyList = [

        "socks4://shuvo420:pakkna100@198.23.239.134:6540", //ORD53-C1  2206 ms
        "socks4://shuvo420:pakkna100@207.244.217.165:6712", // VIE50-P2
       "socks4://shuvo420:pakkna100@107.172.163.27:6543", // JFK50-P6 3361 ms
       "socks4://shuvo420:pakkna100@173.211.0.148:6641",  // LAX53-P4 3267 ms
        "socks4://shuvo420:pakkna100@216.10.27.159:6837", //LAX53-P4 3267 ms
        "socks4://shuvo420:pakkna100@167.160.180.203:6754", // LAX53-P4  2679 ms
        "socks4://shuvo420:pakkna100@154.36.110.199:6853", //MAD51-C2 2250 ms
       "socks4://shuvo420:pakkna100@173.0.9.70:5653", // IAD12-P2 2250 ms
        "socks4://shuvo420:pakkna100@173.0.9.209:5792", //IAD12-P2  2988 ms
        "socks4://shuvo420:pakkna100@161.123.152.115:6360" // MAD51-C2  2488 ms
    ];
    

// Function to get a random proxy from the list
function getRandomProxy() {
    const randomIndex = Math.floor(Math.random() * proxyList.length);
    return proxyList[randomIndex];
}

// Function to make a request using a random proxy
async function getIpWithProxy() {
    const randomProxy = getRandomProxy();
    const agent = new HttpsProxyAgent(randomProxy);
    const startTime = Date.now();
    try {
        // Use an alternative IP service for testing
        const response = await axios.get('https://payment.ivacbd.com/payment/check/BGDDW1477724', { httpsAgent: agent });
        // Accessing the 'x-amz-cf-pop' header from the response
        const xAmzCfPop = response.headers['x-amz-cf-pop'];
 
        console.log('ip:', randomProxy);
        console.log('x-amz-cf-pop:', xAmzCfPop);
        const endTime = Date.now();
        const responseTime = endTime - startTime; // Calculate response time in milliseconds

        console.log('Response Status Code:', response.statusCode);
        console.log('Response Body:',  response.data);
        console.log('Response Time:', responseTime, 'ms');
    } catch (error) {
        console.error('Error fetching IP:', error.message);
    }
}

getIpWithProxy();
