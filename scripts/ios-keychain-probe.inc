// Appended only by the isolated simulator build. Never part of a production build.
#import <UIKit/UIKit.h>
@interface OrbitSecureStorage (IsolatedProbe)
@end
@implementation OrbitSecureStorage (IsolatedProbe)
+ (void)load
{
  NSTimeInterval launchedAt = [NSDate date].timeIntervalSince1970 * 1000;
  dispatch_async(dispatch_get_main_queue(), ^{
    OrbitSecureStorage *store = [OrbitSecureStorage new];
    NSString *key = @"orbit:isolated-ios-keychain-qa:crud";
    NSString *persistKey = @"orbit:isolated-ios-keychain-qa:relaunch";
    NSString *value = [@"தமிழ் 🩺 " stringByAppendingString:[@"" stringByPaddingToLength:16000 withString:@"医学" startingAtIndex:0]];
    NSMutableArray *failures = [NSMutableArray new];
    __block id actual = nil;
    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {
      [failures addObject:code ?: @"E_UNKNOWN"];
    };
    RCTPromiseResolveBlock resolve = ^(id result) { actual = result; };
    [store removeItem:key resolve:resolve reject:reject];
    [store getItem:key resolve:resolve reject:reject];
    if (actual != nil) [failures addObject:@"missing_read"];
    [store setItem:key value:value resolve:resolve reject:reject];
    [store getItem:key resolve:resolve reject:reject];
    if (![actual isEqual:value]) [failures addObject:@"unicode_large_roundtrip"];
    [store setItem:key value:@"replacement" resolve:resolve reject:reject];
    [store getItem:key resolve:resolve reject:reject];
    if (![actual isEqual:@"replacement"]) [failures addObject:@"overwrite"];
    [store removeItem:key resolve:resolve reject:reject];
    [store removeItem:key resolve:resolve reject:reject];
    [store getItem:key resolve:resolve reject:reject];
    if (actual != nil) [failures addObject:@"delete"];
    NSURL *directory = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] firstObject];
    NSURL *report = [directory URLByAppendingPathComponent:@"ios-keychain-qa.json"];
    BOOL previousLaunch = [[NSFileManager defaultManager] fileExistsAtPath:report.path];
    NSString *phase = @"written";
    if (previousLaunch) {
      [store getItem:persistKey resolve:resolve reject:reject];
      if (![actual isEqual:@"isolated-persistence-sentinel"]) [failures addObject:@"relaunch_persistence"];
      phase = @"verified";
    }
    // Keep this synthetic sentinel for all subsequent simulator relaunches.
    [store setItem:persistKey value:@"isolated-persistence-sentinel" resolve:resolve reject:reject];
    NSMutableDictionary *result = [@{@"pass": @(failures.count == 0), @"phase": phase, @"failures": failures, @"jsi": @NO} mutableCopy];
    NSData *json = [NSJSONSerialization dataWithJSONObject:result options:0 error:nil];
    [json writeToURL:report atomically:YES];
    // Require a fresh result from this process's JS -> JSI -> Keychain path.
    // A previous launch's marker must never make a broken bridge pass.
    dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_main_queue());
    __block NSUInteger attempts = 0;
    dispatch_source_set_timer(timer, DISPATCH_TIME_NOW, NSEC_PER_SEC, NSEC_PER_SEC / 10);
    dispatch_source_set_event_handler(timer, ^{
      __block id marker = nil;
      [store getItem:@"orbit:isolated-ios-keychain-qa:jsi" resolve:^(id value) { marker = value; } reject:reject];
      NSDictionary *binding = [marker isKindOfClass:NSString.class]
        ? [NSJSONSerialization JSONObjectWithData:[marker dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil] : nil;
      if ([binding isKindOfClass:NSDictionary.class] && [binding[@"timestamp"] doubleValue] >= launchedAt) {
        result[@"jsi"] = @([binding[@"pass"] isEqual:@YES]);
        result[@"pass"] = @(failures.count == 0);
        NSData *updated = [NSJSONSerialization dataWithJSONObject:result options:0 error:nil];
        [updated writeToURL:report atomically:YES];
        dispatch_source_cancel(timer);
        dispatch_source_set_event_handler(timer, nil);
      } else if (++attempts >= 120) {
        dispatch_source_cancel(timer);
        dispatch_source_set_event_handler(timer, nil);
      }
    });
    dispatch_resume(timer);
  });
}
@end
