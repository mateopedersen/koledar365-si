import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {consentRecord,validConsent,validUnit,unitForWidth} from '../public/advertising/ad-policy.mjs';
const productionConfig=JSON.parse(readFileSync(new URL('../data/advertising.json',import.meta.url)));
const config={...productionConfig,enabled:true};
test('retained legacy banner identifiers reject wrong origins and dimensions',()=>{
 assert.equal(config.enabled,true);
 assert.equal(config.mobile.key,'8396e9ab561be1cb8eca2e425a8712b7');
 assert.equal(config.desktop.key,'930b3493b3bb201e6f196e0ba536267d');
 assert(config.hosts.includes('koledar365.si'));
 for(const unit of [config.mobile,config.desktop])assert(validUnit(unit,config.scriptHosts));
 assert.equal(unitForWidth(299,config),null);
 assert.equal(unitForWidth(300,config).width,300);
 assert.equal(unitForWidth(727,config).width,300);
 assert.equal(unitForWidth(728,config).width,728);
 assert.equal(unitForWidth(1000,{...config,enabled:false}),null);
 assert.equal(unitForWidth(1000,{...config,desktop:{...config.desktop,src:'https://bauval.org.evil.invalid/22/'+config.desktop.key},mobile:{}}),null);
});
test('old city or analytics choices cannot become advertising consent',()=>{
 const now=Date.now(),valid=consentRecord(true,now);
 assert(validConsent(valid,now));
 for(const value of [null,{version:2,preferences:true,expiresAt:now+5000},{version:1,analytics:true,expiresAt:now+5000},{...valid,advertising:'true'},{...valid,expiresAt:now},{...valid,expiresAt:now+181*86400000}])assert(!validConsent(value,now));
 const denied=consentRecord(false,now);assert(validConsent(denied,now));assert.equal(denied.advertising,false);
});

test('production serves static sponsor HTML rather than a vendor tag',()=>{assert.equal(productionConfig.enabled,true);assert.equal(productionConfig.mode,'sponsored-link');assert.equal(productionConfig.directLinkUnit,'32322917');});
