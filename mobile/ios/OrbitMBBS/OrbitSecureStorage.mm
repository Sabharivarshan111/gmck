#import "OrbitSecureStorage.h"
#import <Security/Security.h>

@implementation OrbitSecureStorage
RCT_EXPORT_MODULE(OrbitSecureStorage)

+ (BOOL)requiresMainQueueSetup { return NO; }

- (NSDictionary *)query:(NSString *)key
{
  return @{(__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
           (__bridge id)kSecAttrService: @"com.aistudio.mbbsqbank.aycxvd.sessions",
           (__bridge id)kSecAttrAccount: key,
           (__bridge id)kSecAttrSynchronizable: @NO};
}

- (void)reject:(RCTPromiseRejectBlock)reject status:(OSStatus)status
{
  // Never put the key or value into logs or error messages.
  NSError *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
  reject(@"E_KEYCHAIN", @"Secure storage operation failed", error);
}

- (void)getItem:(NSString *)key resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  NSMutableDictionary *query = [[self query:key] mutableCopy];
  query[(__bridge id)kSecReturnData] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;
  CFTypeRef result = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  if (status == errSecItemNotFound) { resolve(nil); return; }
  if (status != errSecSuccess) { [self reject:reject status:status]; return; }
  NSData *data = CFBridgingRelease(result);
  NSString *value = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  if (!value) { [self reject:reject status:errSecDecode]; return; }
  resolve(value);
}

- (void)setItem:(NSString *)key value:(NSString *)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  NSDictionary *query = [self query:key];
  NSDictionary *attributes = @{
    (__bridge id)kSecValueData: [value dataUsingEncoding:NSUTF8StringEncoding],
    (__bridge id)kSecAttrAccessible: (__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
  };
  OSStatus status = SecItemUpdate((__bridge CFDictionaryRef)query, (__bridge CFDictionaryRef)attributes);
  if (status == errSecItemNotFound) {
    NSMutableDictionary *item = [query mutableCopy];
    [item addEntriesFromDictionary:attributes];
    status = SecItemAdd((__bridge CFDictionaryRef)item, NULL);
    if (status == errSecDuplicateItem) {
      status = SecItemUpdate((__bridge CFDictionaryRef)query, (__bridge CFDictionaryRef)attributes);
    }
  }
  if (status != errSecSuccess) { [self reject:reject status:status]; return; }
  resolve(nil);
}

- (void)removeItem:(NSString *)key resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)[self query:key]);
  if (status != errSecSuccess && status != errSecItemNotFound) {
    [self reject:reject status:status]; return;
  }
  resolve(nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeOrbitSecureStorageSpecJSI>(params);
}
@end
