package il.co.directscope.app;

import android.Manifest;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;

/**
 * Opens the site full screen. On the very first launch it first asks once for the location permission
 * ("הפעל מיקום" on the property address fills the address from it).
 *
 * Why here: Android 14+ blocks an app from showing a permission dialog while Chrome is in front, so the
 * library's own on-demand dialog never appears. Asked here, while the app is on screen, it works –
 * and from then on Chrome gets the location through DelegationService.
 */
public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    private static final int REQUEST_LOCATION = 1;
    private static final String PREFS = "directscope";
    private static final String ASKED_LOCATION = "askedLocation";

    private boolean askLocationFirst;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        askLocationFirst = savedInstanceState == null
                && !prefs.getBoolean(ASKED_LOCATION, false)
                && checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED;
        super.onCreate(savedInstanceState);
        if (askLocationFirst) {
            // the launcher is see-through – show the app's background behind the dialog, not the home screen
            getWindow().setBackgroundDrawableResource(R.color.background);
            prefs.edit().putBoolean(ASKED_LOCATION, true).apply();
            requestPermissions(
                    new String[] { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION },
                    REQUEST_LOCATION);
        }
    }

    @Override
    protected boolean shouldLaunchImmediately() {
        return !askLocationFirst;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        // allowed or not, open the site – the address can always be typed by hand
        if (requestCode == REQUEST_LOCATION) launchTwa();
    }
}
