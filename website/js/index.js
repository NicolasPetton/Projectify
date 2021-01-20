function animate() {
	const elements = document.querySelectorAll('.animate');

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.intersectionRatio > 0) {
				console.log(`Ratio: ${entry.intersectionRatio}`);
				entry.target.classList.add('appear');
				observer.unobserve(entry.target);
			}
		});
	}, {threshold: 0.3});

	elements.forEach((element) => {
		observer.observe(element);
	});
}

document.addEventListener("DOMContentLoaded", (event) => {
    animate();
});
