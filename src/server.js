import express from "express";
import morgan from "morgan";
import session from "express-session";
import flash from "express-flash";
import MongoStore from "connect-mongo";
import rootRouter from "./routers/rootRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import { localsMiddleware } from "./middlewares";
import apiRouter from "./routers/apiRouter";

const app = express();
const logger = morgan("dev");

app.use((req, res, next) => {
	res.header("Cross-Origin-Embedder-Policy", "require-corp");
	res.header("Cross-Origin-Opener-Policy", "same-origin");
	next();
});
app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//encoded 가 라우터 전에 선언돼서 포스트 하기 전에 body 를 가져올수 있는것. 그리고 그 body에 있는 form이 자바스크립트 해석될수 있도록 도와주는 middleware가 바로 이것이다!

app.use(
	session({
		secret: process.env.COOKIE_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 200000,
		},
		store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
	})
);

app.use(flash());
app.use(localsMiddleware); //session이 생기고 다음에 넣어야함
app.use("/uploads", express.static("uploads"));
app.use("/static", express.static("assets"));
app.use("/", rootRouter);
app.use("/videos", videoRouter);
app.use("/users", userRouter);
app.use("/api", apiRouter);

export default app;
