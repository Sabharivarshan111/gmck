package com.orbit.qa;

import android.app.Activity;
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
      AccessibilityNodeInfo root = getUiAutomation().getRootInActiveWindow();
      for (int i=0; root == null && i<10; i++) {
        android.os.SystemClock.sleep(50);
        root = getUiAutomation().getRootInActiveWindow();
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
    for (int i = 0; i < value.getChildCount(); i++) {
      AccessibilityNodeInfo child = value.getChild(i);
      if (child != null) { if (child.isVisibleToUser()) node(xml, child, depth + 1); child.recycle(); }
    }
    xml.endTag(null, "node");
  }
}
