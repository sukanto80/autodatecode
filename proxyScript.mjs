
import { HttpsProxyAgent } from 'https-proxy-agent';
let proxyReleaseCount=0;
let isSendWithProxyAgent=false;
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

export  function getHeaderConfig(isSendWithProxyAgent,proxyReleaseCount){
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
