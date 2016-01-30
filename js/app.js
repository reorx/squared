$(function() {
    var views = window.views;

    $(window).on('resize', function() {
        views.adjustSquaredHeight();
    });
    $(window).trigger('resize');

    // Initialize squared box
    views.initSquaredBox();

    // Set grid mode, use select to support more later
    views.setGridMode(9);

    // Initialize settings box
    views.initSettingsBox();

    // Initialize url-box
    views.initURLBox();
});
