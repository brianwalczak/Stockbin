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

async function scanQRCode() {
    window.html5QrCode = new Html5Qrcode("reader");
    fadeIn($('.QRCode_overlay'), 200);
    
    Html5Qrcode.getCameras().then(cameras => {
        if(cameras && cameras.length) {
            const backCamera = cameras.find(camera => /back|environment/gi.test(camera.label)) || cameras[0]; // for mobile devices (ie. iPhone)
            
            window.html5QrCode.start(backCamera.id, { fps: 10 }, (text) => {
                try {
                    const url = new URL(text);

                    if(url.origin === window.location.origin && url.pathname.startsWith('/view/')) {
                        window.location.href = url;
                    } else {
                        // keep scanning
                    }
                } catch (error) {
                    // keep scanning
                }
            }, (error) => {
                // errors happen if a qr code is not found, based on fps.
                $('.QRCode_overlay .close').show();
                $('.QRCode_overlay .status').show();
            });
        }
    }).catch(err => console.error(err));
}

function closeQRCode() {
    $('.QRCode_overlay').css('visibility', 'hidden');
    
    if(window.html5QrCode) {
        window.html5QrCode.stop().then((ignore) => {
            $('.QRCode_overlay .close').hide();
            $('.QRCode_overlay .status').hide();
            $('#reader').empty();
        }).catch((err) => {
            window.location.reload();
        });
    }
}