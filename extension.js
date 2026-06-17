// PolyKybd Window Reporter — a minimal, read-only GNOME Shell extension.
//
// Exposes a single D-Bus method, GetFocusedWindow(), on the session bus so that
// PolyKybdHost can learn which window is focused on GNOME/Wayland (where Mutter
// does not expose the active window over X11/EWMH, so pywinctl can't see native
// Wayland windows).
//
// Security posture: this interface is read-only *by construction*. The
// introspection XML below declares only the getter, so the bus literally cannot
// route a window-modifying call (Move/Resize/Activate/Close/…). Never add a
// method that takes a window id and acts on it.

import Gio from 'gi://Gio';

const IFACE = `
<node>
  <interface name="org.polykybd.WindowReporter">
    <method name="GetFocusedWindow">
      <arg type="s" direction="out" name="json"/>
    </method>
  </interface>
</node>`;

export default class WindowReporterExtension {
    enable() {
        this._dbus = Gio.DBusExportedObject.wrapJSObject(IFACE, this);
        this._dbus.export(Gio.DBus.session, '/org/polykybd/WindowReporter');
    }

    disable() {
        // Must unexport: extensions are disabled on the lock screen, and leaking
        // the export would fail re-enable. No timers/signals/state to leak.
        this._dbus?.unexport();
        this._dbus = null;
    }

    GetFocusedWindow() {
        const w = global.display.get_focus_window();
        if (!w)
            return 'null'; // nothing focused (e.g. the overview) — a real "none"
        return JSON.stringify({
            id: w.get_id(),
            wm_class: w.get_wm_class() ?? '',
            wm_class_instance: w.get_wm_class_instance() ?? '',
            title: w.get_title() ?? '',
        });
    }
}
