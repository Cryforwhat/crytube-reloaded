const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const deleteComments = document.querySelectorAll("#deleteComment");
const videoComments = document.querySelectorAll("video__comment");

const addComment = (text, id) => {
	const videoComments = document.querySelector(".video__comments ul");
	const newComment = document.createElement("li");
	newComment.dataset.id = id;

	const icon = document.createElement("i");
	const span = document.createElement("span");
	const delete_icon = document.createElement("span");

	newComment.className = "video__comment";
	icon.className = "fas fa-comment";
	span.innerText = ` ${text}`;
	delete_icon.innerText = " ❌";
	delete_icon.id = "deleteComment";

	newComment.appendChild(icon);
	newComment.appendChild(span);
	newComment.appendChild(delete_icon);

	videoComments.prepend(newComment);

	delete_icon.addEventListener("click", handleDeleteComment);
};

const handleSubmit = async (event) => {
	event.preventDefault();
	const textarea = form.querySelector("textarea");
	const btn = form.querySelector("button");
	const videoId = videoContainer.dataset.id;
	const text = textarea.value;
	if (text === "") {
		return;
	}

	const response = await fetch(`/api/videos/${videoId}/comment`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			text,
		}),
	});
	if (response.status === 201) {
		textarea.value = "";
		const { newCommentId } = await response.json();
		addComment(text, newCommentId);
	}
};

const handleDeleteComment = async (event) => {
	const target = event.target;
	const deleteComment = target.parentElement;
	const commentId = deleteComment.dataset.id;

	const response = await fetch(`/api/comments/${commentId}/delete`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ commentId }),
	});

	if (response.status === 200) {
		deleteComment.remove();
	}
};

if (form) {
	form.addEventListener("submit", handleSubmit);
}

deleteComments.forEach((deleteComment) => {
	deleteComment.addEventListener("click", handleDeleteComment);
});
