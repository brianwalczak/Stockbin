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

async function fadeIn(elem, ms) {
	var opacity = 0;

	elem.css('opacity', opacity);
	elem.css('visibility', 'visible');

	var timer = await setInterval(() => {
		if (opacity >= 1) {
			elem.css('opacity', 1);
			clearInterval(timer);
			return;
		}

		opacity += 0.1;
		elem.css('opacity', opacity);
	}, ms / 10);
}

async function getQRCode() {
    try {
        const code = await QRCode.toDataURL(window.location.href, {
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        
        $('.QRCode_overlay .code').attr('src', code);
        await fadeIn($('.QRCode_overlay'), 200);
    } catch(error) {
        alert('Whoops! An unknown error occured while generating the QR code.');
        return console.error(error);
    }
}

function printQRCode() {
    const URL = $('.QRCode_overlay .code').attr('src');
    if(!URL.length) return;

    const win = window.open('_blank');
    return win.document.write(`<img src="${URL}" width="400" height="400" onload="window.print(); window.close();" />`);
}

function closeQRCode() {
    $('.QRCode_overlay').css('visibility', 'hidden');
}