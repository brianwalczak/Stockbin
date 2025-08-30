function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        $.ajax({
            url: '/api/user/delete',
            type: 'POST',
            success: function (result) {
                window.location.href = '/login';
            },
            error: function (err) {
                alert('An error occurred while deleting your account. Please try again later.');
            }
        });
    }
}

$(document).ready(function () {
    $('#timezone').on('change', function () {
        var timezone = $(this).val();

        $.ajax({
            url: '/api/user/update',
            type: 'POST',
            data: { timezone: timezone },
            error: function (err) {
                alert('Whoops! An error occurred while updating your timezone. Please try again later.');
            }
        });
    });
});