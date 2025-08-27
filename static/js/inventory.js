$(document).ready(function () {
    $('.select label.item').click(function (e) {
        e.preventDefault();
        $('.select label.item').removeClass('border-red-500').addClass('border-transparent hover:text-gray-600 hover:border-gray-300');
        $(this).removeClass('border-transparent hover:text-gray-600 hover:border-gray-300').addClass('border-red-500');

        $(this).trigger('change');
    });

    $('.select.type label.item').click(function (e) {
        const val = $(this).attr('value');
        
        const url = new URL(window.location.href);
        url.searchParams.set('type', val);
        url.searchParams.delete('page'); // delete the page param to start clean
        window.location.href = url;
    });

    $('form.item, form.bin').submit(function (e) {
        e.preventDefault();
        $('.status').css('color', '#ef9d00').text('Processing your request, please wait...');

        var form = $(this);
        $.post(form.attr('action'), form.serialize(), function (response) {
            if (response.success) {
                const type = form.hasClass('item') ? 'item' : 'bin';

                const url = new URL(window.location.href);
                url.searchParams.set('success', 'true');
                url.searchParams.set('message', encodeURIComponent(`Success! Your ${type} has been added to your inventory.`));
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
    const type = params.get('type') ?? '';

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

    if (type.length > 0 && $('.radio input[type="radio"][value="' + type + '"]').length > 0) {
        $('.radio input[type="radio"][value="' + type + '"]').parent().click();
    }
});