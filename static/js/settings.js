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