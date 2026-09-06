package com.aistudio.mbbsqbank.aycxvd

import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONArray
import org.json.JSONObject

/**
 * Google Play Billing, wrapped for JavaScript.
 *
 * See NativeOrbitBilling.ts for why this is hand-written rather than a library,
 * and for the three things it deliberately refuses to do (grant, acknowledge,
 * or name a price).
 *
 * **There is no `acknowledge` here on purpose.** Play auto-refunds an
 * unacknowledged purchase after three days, so acknowledgement is the receipt
 * for a grant that has actually happened — `play-verify-purchase` does it,
 * server-side, after asking the Play Developer API what the token really is.
 * Acknowledging next to `launchBillingFlow` would be this app promising Play
 * that a grant happened before anything had checked whether it should.
 *
 * Nothing here can be exercised in this repo: no emulator with Play services,
 * no Play account, and Billing answers nothing at all for a build Play did not
 * install — which is every APK CI produces. `npm run check:billing` asserts the
 * contract; the first real proof is a licence tester on the internal track.
 */
@ReactModule(name = BillingModule.NAME)
class BillingModule(reactContext: ReactApplicationContext) :
  NativeOrbitBillingSpec(reactContext) {

  override fun getName(): String = NAME

  /**
   * The one purchase flow in flight, resolved by the listener below.
   *
   * `launchBillingFlow` returns immediately and the actual result arrives on
   * `PurchasesUpdatedListener` — there is no Activity result to key on, so the
   * promise has to be parked here. One at a time: Play will not show a second
   * sheet over the first, and two parked promises could not be told apart.
   */
  private var pending: Promise? = null

  /**
   * Product details from the last `products()` call, by product id.
   *
   * `launchBillingFlow` needs the `ProductDetails` OBJECT, not an id — it
   * carries the offer Play built. Re-querying inside `buy` would be a second
   * round trip in the moment the reader has just tapped Buy, and would fail
   * offline after the price had already been shown.
   */
  private val known = mutableMapOf<String, ProductDetails>()

  private val purchaseListener =
    PurchasesUpdatedListener { result, purchases ->
      val promise = pending ?: return@PurchasesUpdatedListener
      pending = null
      when (result.responseCode) {
        BillingClient.BillingResponseCode.OK -> {
          val purchase = purchases?.firstOrNull()
          if (purchase == null) {
            // OK with nothing in it: Play accepted the flow but has no purchase
            // to report yet. Not a failure, and not something to grant on.
            promise.resolve(outcome("pending", message = "no purchase returned"))
          } else {
            promise.resolve(describe(purchase))
          }
        }
        // Backing out of the sheet is an answer, not an error. The caller
        // should not have to tell "changed my mind" from "Play broke" in a
        // catch block.
        BillingClient.BillingResponseCode.USER_CANCELED ->
          promise.resolve(outcome("cancelled"))
        // Already owned, and Play will not sell it twice. The token is in
        // `restore`, which is exactly where a caller should look next.
        BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED ->
          promise.resolve(outcome("owned"))
        else ->
          promise.resolve(
            outcome("failed", message = "${result.responseCode}: ${result.debugMessage}")
          )
      }
    }

  /**
   * `enablePendingPurchases` is required by the library and is not a formality:
   * India's deferred methods (UPI mandates, cash) come back PENDING, where the
   * reader owes nothing yet and nothing may be granted. Without it the client
   * refuses to build at all.
   *
   * `enableAutoServiceReconnection` (Billing 8+) removes the whole class of
   * "the service disconnected once and nothing ever worked again" bug that
   * every hand-rolled reconnect loop eventually reinvents badly.
   */
  private val client: BillingClient =
    BillingClient.newBuilder(reactContext)
      .setListener(purchaseListener)
      .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
      .enableAutoServiceReconnection()
      .build()

  override fun invalidate() {
    // A promise parked across a reload would never resolve, and the JS side
    // would sit on a spinner for ever.
    pending?.resolve(outcome("cancelled", message = "module torn down"))
    pending = null
    runCatching { client.endConnection() }
    super.invalidate()
  }

  /**
   * Run [block] once the client is connected, or hand [onUnavailable] the
   * reason it will never be.
   *
   * Every entry point goes through this. A BillingClient that has not finished
   * connecting silently answers nothing, and "no products" and "not connected
   * yet" look identical from JavaScript.
   */
  private fun connected(onUnavailable: (String) -> Unit, block: () -> Unit) {
    if (client.isReady) {
      block()
      return
    }
    runCatching {
      client.startConnection(
        object : BillingClientStateListener {
          override fun onBillingSetupFinished(result: BillingResult) {
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
              block()
            } else {
              // BILLING_UNAVAILABLE on a device with no Play Store, an old Play
              // services, or a sideloaded build. All ordinary.
              onUnavailable("${result.responseCode}: ${result.debugMessage}")
            }
          }

          override fun onBillingServiceDisconnected() {
            // Auto-reconnection handles the retry. Nothing to do here, and
            // resolving the promise from here would race the success path.
          }
        }
      )
    }
      .onFailure { onUnavailable(it.message ?: "connection failed") }
  }

  private fun outcome(
    status: String,
    productId: String = "",
    token: String = "",
    orderId: String = "",
    acknowledged: Boolean = false,
    accountId: String = "",
    message: String = "",
  ): String =
    JSONObject()
      .put("status", status)
      .put("productId", productId)
      .put("token", token)
      .put("orderId", orderId)
      .put("acknowledged", acknowledged)
      .put("obfuscatedAccountId", accountId)
      .put("message", message)
      .toString()

  private fun describeObject(purchase: Purchase): JSONObject {
    val state =
      when (purchase.purchaseState) {
        Purchase.PurchaseState.PURCHASED -> "purchased"
        Purchase.PurchaseState.PENDING -> "pending"
        else -> "failed"
      }
    return JSONObject()
      .put("status", state)
      .put("productId", purchase.products.firstOrNull() ?: "")
      .put(
        // The ONLY field worth sending anywhere. Everything else here is for
        // the admin panel; this is what the Play Developer API is asked about.
        "token",
        if (state == "purchased") purchase.purchaseToken else "",
      )
      .put("orderId", purchase.orderId ?: "")
      .put("acknowledged", purchase.isAcknowledged)
      .put("obfuscatedAccountId", purchase.accountIdentifiers?.obfuscatedAccountId ?: "")
      .put("message", "")
  }

  private fun describe(purchase: Purchase): String = describeObject(purchase).toString()

  override fun available(promise: Promise) {
    connected({ promise.resolve(false) }) { promise.resolve(true) }
  }

  override fun products(productIdsJson: String, kind: String, promise: Promise) {
    val ids =
      runCatching {
        val array = JSONArray(productIdsJson)
        (0 until array.length()).map { array.getString(it) }
      }
        .getOrElse {
          promise.resolve("[]")
          return
        }
    if (ids.isEmpty()) {
      promise.resolve("[]")
      return
    }
    val type =
      if (kind == "subs") BillingClient.ProductType.SUBS else BillingClient.ProductType.INAPP

    connected({ promise.resolve("[]") }) {
      val params =
        QueryProductDetailsParams.newBuilder()
          .setProductList(
            ids.map {
              QueryProductDetailsParams.Product.newBuilder()
                .setProductId(it)
                .setProductType(type)
                .build()
            }
          )
          .build()
      client.queryProductDetailsAsync(params) { result, details ->
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
          // An empty list, never a placeholder. A placeholder price is a price
          // this app made up, and the reader would be charged a different one.
          promise.resolve("[]")
          return@queryProductDetailsAsync
        }
        val out = JSONArray()
        details.productDetailsList.forEach { product ->
          known[product.productId] = product
          if (product.productType == BillingClient.ProductType.SUBS) {
            // One entry per base plan: a subscription with monthly, six-month
            // and yearly plans is three things a reader can buy, and each needs
            // its own offer token.
            product.subscriptionOfferDetails.orEmpty().forEach { offer ->
              val phase = offer.pricingPhases.pricingPhaseList.lastOrNull()
              out.put(
                JSONObject()
                  .put("productId", product.productId)
                  .put("kind", "subs")
                  .put("title", product.title)
                  .put("description", product.description)
                  .put("formattedPrice", phase?.formattedPrice ?: "")
                  .put("priceAmountMicros", phase?.priceAmountMicros ?: 0L)
                  .put("priceCurrencyCode", phase?.priceCurrencyCode ?: "")
                  .put("basePlanId", offer.basePlanId)
                  .put("offerToken", offer.offerToken)
                  .put("billingPeriod", phase?.billingPeriod ?: "")
              )
            }
          } else {
            val offer = product.oneTimePurchaseOfferDetails
            out.put(
              JSONObject()
                .put("productId", product.productId)
                .put("kind", "inapp")
                .put("title", product.title)
                .put("description", product.description)
                .put("formattedPrice", offer?.formattedPrice ?: "")
                .put("priceAmountMicros", offer?.priceAmountMicros ?: 0L)
                .put("priceCurrencyCode", offer?.priceCurrencyCode ?: "")
                .put("basePlanId", "")
                .put("offerToken", "")
                .put("billingPeriod", "")
            )
          }
        }
        promise.resolve(out.toString())
      }
    }
  }

  override fun buy(productId: String, offerToken: String, accountId: String, promise: Promise) {
    val activity = getCurrentActivity()
    val details = known[productId]
    if (activity == null || details == null) {
      // No details means `products` was never called or returned nothing, and
      // there is no offer object to launch. Asking Play again here would show a
      // sheet for a price the reader was never shown.
      promise.resolve(outcome("unavailable", productId, message = "no product details"))
      return
    }
    pending?.resolve(outcome("cancelled", message = "superseded"))
    pending = promise

    val paramsBuilder =
      BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details)
    if (offerToken.isNotEmpty()) {
      paramsBuilder.setOfferToken(offerToken)
    }
    val flow =
      BillingFlowParams.newBuilder()
        .setProductDetailsParamsList(listOf(paramsBuilder.build()))
        // Play echoes this back on the purchase and on every Real-Time
        // Developer Notification about it. It is how a renewal that arrives
        // three weeks later, with no session and no app running, is attributed
        // to an account at all.
        .setObfuscatedAccountId(accountId)
        .build()

    connected({
      pending = null
      promise.resolve(outcome("unavailable", productId, message = it))
    }) {
      val result = runCatching { client.launchBillingFlow(activity, flow) }
      val code = result.getOrNull()?.responseCode
      if (result.isFailure || code != BillingClient.BillingResponseCode.OK) {
        // The listener will never fire for a flow that did not launch, so the
        // promise has to be resolved here or it is parked for ever.
        if (pending === promise) {
          pending = null
          promise.resolve(
            outcome("failed", productId, message = result.exceptionOrNull()?.message ?: "$code")
          )
        }
      }
    }
  }

  override fun restore(kind: String, promise: Promise) {
    val type =
      if (kind == "subs") BillingClient.ProductType.SUBS else BillingClient.ProductType.INAPP
    connected({ promise.resolve("[]") }) {
      client.queryPurchasesAsync(
        QueryPurchasesParams.newBuilder().setProductType(type).build()
      ) { result, purchases ->
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
          promise.resolve("[]")
          return@queryPurchasesAsync
        }
        val out = JSONArray()
        purchases.forEach { out.put(describeObject(it)) }
        promise.resolve(out.toString())
      }
    }
  }

  companion object {
    const val NAME = "OrbitBilling"
  }
}
