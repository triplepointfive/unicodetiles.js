
function createRendererSwitcher(doSwitch) {
	// Determine the current renderer and the next one
	var curR = term.getRendererString();
	var nextR, pretty;
	if (curR === "canvas") {
		nextR = "dom";
		pretty = "DOM";
	} else {
		nextR = "canvas";
		pretty = "&lt;canvas&gt;";
	}
	// Do we switch?
	if (doSwitch) {
		term.setRenderer(nextR);
		createRendererSwitcher(); // Call again to update, but this time no switching
		return;
	}
	// The HTML
	var html = '<p>Renderer: <span id="renderer">'+curR+'</span> ';
	html += '<a onclick="createRendererSwitcher(true)" href="#">Switch to '+pretty+'</button></p>';
	document.getElementById("renderer-switcher").innerHTML = html;
}
