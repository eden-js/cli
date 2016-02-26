/**
 * Created by Awesome on 1/30/2016.
 */

module.exports = {
    port         : '3001',
    environment  : 'dev',
    apiUrl       : 'http://192.168.0.71:8081/Baseplan.Enterprise.Gateway.QueryServices_ATF_AUS1402/EnterpriseQueryService.svc/',
    apiMobileUrl : 'http://192.168.0.71:8081/Baseplan.Enterprise.Gateway.HireMobility_ATF_AUS1402/',
    database     : {
        dev : {
            host : 'localhost',
            db   : 'EdenFrame'
        }
    }
};