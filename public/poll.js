$('.init-new-option').click(function() {
	$('.init-new-option').toggle(400, function() {
		$('.new-option-form').toggle(400);
	});
});

$('.cancel-new').click(function() {
	$('.new-option-form').toggle(400, function() {
		$('.init-new-option').toggle(400);
	});
})