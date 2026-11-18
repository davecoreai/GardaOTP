import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOtpCode,normalizeOrderStatus,orderHasReceipt,providerSnapshotAllowsRefund} from '../lib/order-policy.js';

test('OTP string and object payloads are normalized to the code',()=>{
 assert.equal(normalizeOtpCode(' 839102 '),'839102');
 assert.equal(normalizeOtpCode({code:' 712345 ',message:'hello'}),'712345');
 assert.equal(normalizeOtpCode(null),null);
});

test('refund is allowed only for provider-confirmed terminal orders with no OTP evidence',()=>{
 assert.equal(providerSnapshotAllowsRefund({status:'cancelled',otp:null,has_receipt:false}),true);
 assert.equal(providerSnapshotAllowsRefund({status:'expired',otp:null,has_receipt:false}),true);
 assert.equal(providerSnapshotAllowsRefund({status:'awaiting_otp',otp:null,has_receipt:false}),false);
 assert.equal(providerSnapshotAllowsRefund({status:'completed',otp:null,has_receipt:false}),false);
});

test('receipt, completion timestamp, or OTP blocks a full refund',()=>{
 assert.equal(providerSnapshotAllowsRefund({status:'expired',otp:{code:'111222'},has_receipt:false}),false);
 assert.equal(providerSnapshotAllowsRefund({status:'expired',otp:null,has_receipt:true}),false);
 assert.equal(providerSnapshotAllowsRefund({status:'cancelled',otp:null,completed_at:'2026-11-18T10:00:00Z'}),false);
 assert.equal(orderHasReceipt({otp:{code:'111222'}}),true);
});

test('status normalization rejects unexpected characters',()=>{
 assert.equal(normalizeOrderStatus(' CANCELLED '),'cancelled');
 assert.equal(normalizeOrderStatus('<script>'),'script');
});
