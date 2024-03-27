import User from "../models/User";
import Video from "../models/Video";
import fetch from "node-fetch";
import bcrypt from "bcrypt";

import { token } from "morgan";

export const getJoin = (req, res) => res.render("join", { pageTitle: "Join" });
export const postJoin = async (req, res) => {
	const { name, username, email, password, password2, location } = req.body;
	const pageTitle = "Join";
	if (password !== password2) {
		return res.status(400).render("join", {
			pageTitle,
			errorMessage: "Password confirmation does not match.",
		});
	}

	const exists = await User.exists({
		$or: [{ username }, { email }],
	});
	if (exists) {
		return res.status(400).render("join", {
			pageTitle,
			errorMessage: "This username/email is already taken",
		});
	}

	try {
		await User.create({
			name,
			username,
			email,
			password,
			location,
		});
		res.redirect("/login");
	} catch (error) {
		return res.status(400).render("join", {
			pageTitle: "Error",
			errorMessage: error._message,
		});
	}
};
export const getLogin = (req, res) => res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
	const { username, password } = req.body;
	const pageTitle = "Login";
	const user = await User.findOne({ username, socialOnly: false });

	if (!user) {
		return res.status(400).render("login", {
			pageTitle,
			errorMessage: "An account with this username does not exists",
		});
	}

	const ok = await bcrypt.compare(password, user.password);

	if (!ok) {
		return res.status(400).render("login", {
			pageTitle,
			errorMessage: "Incorrect password",
		});
	}

	req.session.loggedIn = true;
	req.session.user = user;
	return res.redirect("/");
};
export const startGithubLogin = (req, res) => {
	const baseURL = "https://github.com/login/oauth/authorize";
	const config = {
		client_id: process.env.GH_CLIENT,
		allow_signup: false,
		scope: "read:user user:email",
	};
	const params = new URLSearchParams(config).toString();
	const finalURL = `${baseURL}?${params}`;

	return res.redirect(finalURL);
};

export const finishGithubLogin = async (req, res) => {
	const baseURL = "https://github.com/login/oauth/access_token";
	const config = {
		client_id: process.env.GH_CLIENT,
		client_secret: process.env.GH_SECRET,
		code: req.query.code,
	};
	const params = new URLSearchParams(config).toString();
	const finalURL = `${baseURL}?${params}`;

	const tokenRequest = await (
		await fetch(finalURL, {
			method: "POST",
			headers: {
				Accept: "application/json",
			},
		})
	).json(); //Extracting Json from data
	if ("access_token" in tokenRequest) {
		const { access_token } = tokenRequest;
		const apiURL = "https://api.github.com";
		const userData = await (
			await fetch(`${apiURL}/user`, {
				headers: {
					Authorization: `token ${access_token}`,
				},
			})
		).json();
		//console.log(userData);
		const emailData = await (
			await fetch(`${apiURL}/user/emails`, {
				headers: {
					Authorization: `token ${access_token}`,
				},
			})
		).json();
		const emailObject = emailData.find(
			(email) => email.primary === true && email.verified === true
		);
		if (!emailObject) {
			return res.redirect("/login");
		}
		let user = await User.findOne({ email: emailObject.email });
		if (!user) {
			user = await User.create({
				avatarUrl: userData.avatar_url,
				name: userData.name ? userData.name : "Unknown",
				username: userData.login,
				email: emailObject.email,
				password: "",
				socialOnly: true,
				location: userData.location,
			});
		}
		req.session.loggedIn = true;
		req.session.user = user;
		return res.redirect("/");
	} else {
		return res.redirect("/login");
	}
};

export const startKakaoLogin = (req, res) => {
	const baseURL = "https://kauth.kakao.com/oauth/authorize";
	const config = {
		client_id: process.env.KT_CLIENT,
		redirect_uri: "http://localhost:4000/users/kakaotalk/finish",
		response_type: "code",
		scope: "profile_nickname account_email profile_image",
	};
	const params = new URLSearchParams(config).toString();
	const finalURL = `${baseURL}?${params}`;
	return res.redirect(finalURL);
};

export const finishKakaoLogin = async (req, res) => {
	const baseURL = "https://kauth.kakao.com/oauth/token";
	const config = {
		client_id: process.env.KT_CLIENT,
		client_secret: process.env.KT_SECRET,
		redirect_uri: "http://localhost:4000/users/kakaotalk/finish",
		grant_type: "authorization_code",
		code: req.query.code,
	};
	const params = new URLSearchParams(config).toString();
	const finalURL = `${baseURL}?${params}`;
	const tokenRequest = await (
		await fetch(finalURL, {
			method: "POST",
		})
	).json(); //Extracting Json from data

	if ("access_token" in tokenRequest) {
		const { access_token } = tokenRequest;
		const apiURL = "https://kapi.kakao.com/v2/user/me";
		const userData = await (
			await fetch(`${apiURL}`, {
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			})
		).json();
		//console.log(userData);
		//res.send(JSON.stringify(userData));

		const kakaoAccount = userData.kakao_account;
		const emailObject = kakaoAccount.email;
		//console.log(emailObject);

		if (!emailObject) {
			return res.redirect("/login");
		}

		let user = await User.findOne({ email: emailObject });

		if (!user) {
			user = await User.create({
				avatarUrl: kakaoAccount.profile.profile_image_url,
				name: kakaoAccount.profile.nickname,
				username: kakaoAccount.profile.nickname,
				email: emailObject,
				password: "",
				socialOnly: true,
				location: "",
			});
		}
		req.session.loggedIn = true;
		req.session.user = user;
		return res.redirect("/");
	} else {
		return res.redirect("/login");
	}
};

export const logout = (req, res) => {
	req.session.user = null;
	res.locals.loggedInUser = req.session.user;
	req.session.loggedIn = false;
	req.flash("info", "You are logged out");
	return res.redirect("/");
};

export const getEdit = (req, res) => {
	return res.render("edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
	const {
		session: {
			user: { _id, avatarUrl, email: sessionEmail, username: sessionUsername },
		},
		body: { name, email, username, location },
		file,
	} = req;

	//console.log(file);

	const usernameExists =
		username != sessionUsername ? await User.exists({ username }) : undefined;
	const emailExists = email != sessionEmail ? await User.exists({ email }) : undefined;
	if (usernameExists || emailExists) {
		return res.status(400).render("edit-profile", {
			pageTitle: "Edit Profile",
			usernameErrorMessage: usernameExists ? "This username is already taken" : 0,
			emailErrorMessage: emailExists ? "This email is already taken" : 0,
		});
	}

	const updatedUser = await User.findByIdAndUpdate(
		_id,
		{
			avatarUrl: file ? file.path : avatarUrl,
			email,
			username,
			location,
		},
		{ new: true }
	);
	req.flash("success", "User info Updated");
	req.session.user = updatedUser;
	return res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
	if (req.session.user.socialOnly === true) {
		req.flash("error", "Couldn't change the password");

		return res.redirect("/");
	}
	return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
	const {
		session: {
			user: { _id },
		},
		body: { oldPassword, newPassword, newPasswordConfirm },
	} = req;
	const user = await User.findById(_id);

	const ok = await bcrypt.compare(oldPassword, user.password);

	if (!ok) {
		return res.status(400).render("users/change-password", {
			pageTitle: "Change Password",
			errorMessage: "The current password is incorrect.",
		});
	}

	if (newPassword !== newPasswordConfirm) {
		return res.status(400).render("users/change-password", {
			pageTitle: "Change Password",
			errorMessage: "The password does not match.",
		});
	}
	user.password = newPassword;
	await user.save();
	req.flash("info", "Password updated");

	return res.redirect("/users/logout");
};
export const remove = (req, res) => res.send("Remove User");

export const see = async (req, res) => {
	const { id } = req.params;
	const user = await User.findById(id).populate("videos");

	if (!user) {
		return res.status(404).render("404", { pageTitle: "User not found." });
	}

	return res.render("users/profile", { pageTitle: user.name, user });
};
