package il.co.directscope.app;

import com.google.androidbrowserhelper.locationdelegation.LocationDelegationExtraCommandHandler;

/**
 * Lets the site ask for the phone's location ("הפעל מיקום" on the property address):
 * Chrome hands the request to the app, which shows Android's own location permission dialog.
 */
public class DelegationService extends com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();
        registerExtraCommandHandler(new LocationDelegationExtraCommandHandler());
    }
}
