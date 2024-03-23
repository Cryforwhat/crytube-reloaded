import express from "express";
import {
	getEdit,
	postEdit,
	remove,
	logout,
	see,
	startGithubLogin,
	finishGithubLogin,
	startKakaoLogin,
	finishKakaoLogin,
	getChangePassword,
	postChangePassword,
} from "../controllers/userController";
import { protectorMiddleware, publicOnlyMiddleware, avatarUpload } from "../middlewares";

const userRouter = express.Router();

userRouter.get("/logout", protectorMiddleware, logout);
userRouter
	.route("/edit")
	.all(protectorMiddleware)
	.get(getEdit)
	.post(avatarUpload.single("avatar"), postEdit);
userRouter
	.route("/change-password")
	.all(protectorMiddleware)
	.get(getChangePassword)
	.post(postChangePassword);
userRouter.get("/remove", remove);
userRouter.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter.get("/github/finish", publicOnlyMiddleware, finishGithubLogin);
userRouter.get("/kakaotalk/start", publicOnlyMiddleware, startKakaoLogin);
userRouter.get("/kakaotalk/finish", publicOnlyMiddleware, finishKakaoLogin);

userRouter.get("/:id", see);

export default userRouter;
