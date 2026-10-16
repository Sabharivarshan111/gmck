"""Open the real installed app and its local renderer, without a browser fixture."""
from native_screenshot_driver import launch, first_run, tap, scroll_to_tappable, OUT, shot
from native_anatomy_screenshots import route
launch()
first_run()
tap('Vault')
scroll_to_tappable('Simulator & Anatomy')
tap('Simulator & Anatomy')
route('/simulator?mode=anatomy')
tap('Explore 3D anatomy')
shot('actual-android-bootstrap')
