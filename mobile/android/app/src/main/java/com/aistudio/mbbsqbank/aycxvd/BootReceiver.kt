package com.aistudio.mbbsqbank.aycxvd

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-arms the daily check after a reboot.
 *
 * Android drops every alarm on shutdown. Without this, reminders work until
 * the first restart and then stop — silently, with the toggle still on, which
 * is indistinguishable from the feature not working at all and is how most
 * apps' reminders quietly die.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
      intent.action != "android.intent.action.QUICKBOOT_POWERON"
    ) {
      return
    }
    val prefs = NotifyStore.prefs(context)
    if (!prefs.getBoolean(NotifyStore.KEY_ENABLED, false)) {
      return
    }
    NotifyReceiver.ensureChannel(context)
    NotifyScheduler.schedule(context, prefs.getInt(NotifyStore.KEY_HOUR, 19))
  }
}
