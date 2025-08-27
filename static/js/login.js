const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const $email = $('.LoginFlow [name="email"]');
const $code = $('.LoginFlow [name="code"]');

function isEmail(email) {
	const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
	return emailPattern.test(email);
}

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

async function sendCode(event) {
    event.preventDefault();
    $email.css("border", "1px solid #ccc");
    $(".LoginFlow form.request .status").text("");

    if (!isEmail($email.val())) {
        return $email.css('border', '2px solid #e52f28');
    }

    try {
        await fadeIn($('.LoginFlow_overlay'), 200);

        const response = await $.ajax({
            url: '/api/requestCode',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: $email.val() })
        });

        await sleep(750);
        $('.LoginFlow_overlay').css('visibility', 'hidden');

        if (response.success === false) {
            return $('.LoginFlow form.request .status').css('color', 'red').text(response.reason);
        }
    } catch {
        $('.LoginFlow form.request .status').css('color', 'red').text("Whoops, an error occurred! Please try again.");
    }

    $('.LoginFlow .header').text("Confirm it's you");
    $('.LoginFlow .subheader:first').text("Enter the code that was sent to your email.");

    $('.LoginFlow form.request').hide();
    $('.LoginFlow form.verify').css('display', 'inline-block');
}

async function verifyCode(event) {
    event.preventDefault();
    $code.css('border', '1px solid #ccc');
    $(".LoginFlow form.verify .status").text("");

    if ($code.val().length !== 6 || Number.isNaN(Number($code.val()))) return $code.css('border', '2px solid #e52f28');

    try {
        const response = await $.ajax({
            url: '/api/verifyCode',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                email: $email.val(), 
                code: $code.val() 
            })
        });

        if (response.success === false) {
            return $('.LoginFlow form.verify .status').css('color', 'red').text(response.reason);
        }
    } catch {
        $('.LoginFlow form.verify .status').css('color', 'red').text("Whoops, an error occurred! Please try again.");
    }

    window.location.href = '/';
}

async function newCode() {
    await fadeIn($('.LoginFlow_overlay'), 200);
    $(".LoginFlow form.verify .status").text("");

    const response = await $.ajax({
        url: '/api/requestCode',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email: $email.val() })
    });

    await sleep(750);
    $('.LoginFlow_overlay').css('visibility', 'hidden');

    if (response.success === false) {
        $(".LoginFlow form.verify .status").css('color', 'red').text(response.reason);
    } else {
        $(".LoginFlow form.verify .status").css('color', 'green').text("A new code has been sent to your email.");
    }
}