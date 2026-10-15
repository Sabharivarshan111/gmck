package com.orbit.qa;

import android.app.Activity;
import android.app.UiAutomation;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import android.app.Instrumentation;
import android.graphics.Rect;
import android.os.Bundle;
import android.util.Xml;
import android.view.accessibility.AccessibilityNodeInfo;
import org.xmlpull.v1.XmlSerializer;
import java.io.StringWriter;

/** Separate QA process: read the live accessibility tree without waiting for
 * continuously updating vitals to become idle, and without restarting ORBIT.
 */
public final class UiDump extends Instrumentation {
  private int count = 0;
  @Override public void onCreate(Bundle args) { super.onCreate(args); start(); }
  @Override public void onStart() {
    Bundle result = new Bundle();
    try {
      UiAutomation automation = getUiAutomation();
      AccessibilityServiceInfo info = automation.getServiceInfo();
      info.flags |= AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
      automation.setServiceInfo(info);
      AccessibilityNodeInfo root = null;
      // Keyboard dismissal and activity transitions briefly have no active root.
      // Observe the next real window without waiting for live vitals to go idle.
      for (int i=0; root == null && i<100; i++) {
        root = automation.getRootInActiveWindow();
        if (root == null) for (AccessibilityWindowInfo window : automation.getWindows()) {
          if (window.getType() == AccessibilityWindowInfo.TYPE_APPLICATION) {
            root = window.getRoot();
            if (root != null) break;
          }
        }
        if (root == null) android.os.SystemClock.sleep(100);
      }
      if (root == null) throw new IllegalStateException("No active Android window");
      StringWriter writer = new StringWriter();
      XmlSerializer xml = Xml.newSerializer();
      xml.setOutput(writer);
      xml.startTag(null, "hierarchy");
      node(xml, root, 0);
      xml.endTag(null, "hierarchy");
      xml.flush();
      result.putString("orbit_ui", writer.toString());
      finish(Activity.RESULT_OK, result);
    } catch (Exception error) {
      result.putString("orbit_ui_error", error.toString());
      finish(Activity.RESULT_CANCELED, result);
    }
  }
  private String text(CharSequence value) { return value == null ? "" : value.toString().replace('\n', ' '); }
  private void node(XmlSerializer xml, AccessibilityNodeInfo value, int depth) throws Exception {
    if (value == null || depth > 80 || ++count > 5000) return;
    Rect rect = new Rect(); value.getBoundsInScreen(rect);
    xml.startTag(null, "node");
    xml.attribute(null, "text", text(value.getText()));
    xml.attribute(null, "content-desc", text(value.getContentDescription()));
    xml.attribute(null, "class", text(value.getClassName()));
    xml.attribute(null, "clickable", Boolean.toString(value.isClickable()));
    xml.attribute(null, "enabled", Boolean.toString(value.isEnabled()));
    xml.attribute(null, "scrollable", Boolean.toString(value.isScrollable()));
    xml.attribute(null, "bounds", "["+rect.left+","+rect.top+"]["+rect.right+","+rect.bottom+"]");
    AccessibilityNodeInfo.RangeInfo range = value.getRangeInfo();
    if (range != null) xml.attribute(null, "range-now", Float.toString(range.getCurrent()));
    xml.attribute(null, "selected", Boolean.toString(value.isSelected()));
    xml.attribute(null, "checked", Boolean.toString(value.isChecked()));
    for (int i = 0; i < value.getChildCount(); i++) {
      AccessibilityNodeInfo child = value.getChild(i);
      if (child != null) { if (child.isVisibleToUser()) node(xml, child, depth + 1); child.recycle(); }
    }
    xml.endTag(null, "node");
  }
}
