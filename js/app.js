(function(window) {
    var console = window.console;

    $(function() {
        console.log('app.js');

        var squared_box = $('.squared-box'),
            squared_box_dom = $('.squared-box')[0];
        squared_box.height(squared_box.width());

        // Generate 9 grids
        squared_box.addClass('-grids-9');
        for (var i = 0; i < 4; i++) {
            var grid = $('<div>').addClass('grid-item').html(i);
            squared_box.append(grid);
        }
        squared_box.on({
            'click .close > span': function(e) {
                $(e.target).closest('.grid-item').remove();
            }
        });
        Sortable.create(squared_box_dom, {
            group: {
                name: 'default',
                pull: false,
            },
            animation: 200,
            filter: '.close',
        });

        // Album list sortable
        var album_list = $('.album-list');
        album_list.find('li').each(function() {
            Sortable.create(this, {
                group: {
                    name: 'default',
                    pull: 'clone',
                    put: false,
                },
                onMove: function (e) {
                    if (e.to === squared_box_dom) {
                        if (squared_box_dom.childNodes.length >= 9) {
                            console.log('full');
                            return false;
                        }
                    }
                },
                draggable: '.grid-item',
                animation: 150,
            });
        });

    });

})(window);
