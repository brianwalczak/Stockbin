$(document).ready(function () {
    if (!isEditing) {
        $('.radio label.item').click(function (e) {
            e.preventDefault();
            $('.radio input[type="radio"]').attr('checked', false); // Uncheck all radio buttons

            $('.radio label.item').removeClass('bg-gray-300').addClass('hover:bg-gray-200');
            $(this).removeClass('hover:bg-gray-200').addClass('bg-gray-300');

            $(this).find('input[type="radio"]').attr('checked', true); // Check new radio button
            $(this).find('input[type="radio"]').trigger('change');
        });

        $('.radio input[type="radio"]').change(function () {
            var selected = $(this).val();

            if (selected === 'item') {
                $('form.item').show();
                $('form.bin').hide();
            } else {
                $('form.item').hide();
                $('form.bin').show();
            }
        });
    }

    $('form.item, form.bin').submit(function (e) {
        e.preventDefault();
        $('.status').css('color', '#ef9d00').text('Processing your request, please wait...');

        // Update the form to contain user timezone
        try {
            var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            var $tzData = $(this).find('input[name="timezone"]');

            if ($tzData.length) {
                $tzData.val(tz);
            }
        } catch {};

        var form = $(this);
        $.post(form.attr('action'), form.serialize(), function (response) {
            if (response.success) {
                const type = form.hasClass('item') ? 'item' : 'bin';

                const url = new URL(isEditing ? window.location.href.replace(/\/edit\/[^\/?]+/, `/edit/${response.id}`) : window.location.href); // for editing, update to new UPC in-case of a UPC change
                url.searchParams.set('success', 'true');
                url.searchParams.set('message', encodeURIComponent(`Success! Your ${type} has been ${isEditing ? 'updated in' : 'added to'} your inventory.`));
                window.location.href = url;
            } else {
                $('.status').css('color', 'red').text(response.reason);
            }
        });
    });

    // Check URL parameters for success or message
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success') ?? '';
    const message = params.get('message') ?? '';

    if (message.length > 0) {
        $('.status').text(decodeURIComponent(message));

        if (success === 'true') {
            $('.status').css('color', 'green');
        } else if (success === 'false') {
            $('.status').css('color', 'red');
        }

        // remove params from url without a reload
        history.replaceState(null, '', window.location.pathname);
    }

    if (!isEditing) {
        const type = params.get('type') ?? '';

        if (type.length > 0 && $('.radio input[type="radio"][value="' + type + '"]').length > 0) {
            $('.radio input[type="radio"][value="' + type + '"]').parent().click();
        }
    }
});