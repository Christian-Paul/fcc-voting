// add a new input when all inputs are full

// trigger function whenever input inside of options holder receives input
$('.options-holder').on('input', 'input', function() {
	console.log('i herd ya');

	// assume inputs are full
	// if check reveals that an input is empty this will be set to false
	var inputsFull = true;

	// check to see if all inputs contain text
	$('.options-holder > input').each(function() {
		var input = $(this);

		// if an empty input is found,
		// inputsFull set to false and function cancelled
		if(!input.val()) {
			inputsFull = false;
			return;
		}
	});

	// if all inputs contain text, append a new input
	if(inputsFull) {
		var newInputNumber = $('.options-holder > input').length + 1;

		$('.options-holder').append("<input type='text' name='option-" + newInputNumber + "' placeholder='Enter options here...'>");
	}

});