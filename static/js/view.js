$('form.delete').submit(function (e) {
    e.preventDefault();

    if(!confirm(`Are you sure you want to delete this ${$(this).attr('type')}? ${$(this).attr('type') === 'bin' ? 'This will also remove ALL items in the bin.' : ''} This action cannot be undone.`)) return;
    $('.status').css('color', '#ef9d00').text('Processing your request, please wait...');

    var form = $(this);
    $.post(form.attr('action'), form.serialize(), function (response) {
        if (response.success) {
            if (document.referrer) {
                window.location.href = document.referrer;
            } else {
                window.location.href = '/inventory';
            }
        } else {
            $('.status').css('color', 'red').text(response.reason);
        }
    });
});