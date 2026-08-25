import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    Alert
} from "@mui/material";

import { AuthContext } from "../contexts/AuthContext";

export default function LoginPage() {

    const navigate = useNavigate();

    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {

        e.preventDefault();

        try {

            setLoading(true);

            setError("");

            await login(email, password);

            navigate("/dashboard");

        }

        catch (err) {

            setError("Invalid email or password.");

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <Box

            sx={{

                height: "100vh",

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                background: "#0f172a"

            }}

        >

            <Paper

                sx={{

                    p: 5,

                    width: 400

                }}

            >

                <Typography

                    variant="h4"

                    mb={3}

                    align="center"

                >

                    Matrix AI Trader

                </Typography>

                {error && (

                    <Alert severity="error">

                        {error}

                    </Alert>

                )}

                <form onSubmit={handleLogin}>

                    <TextField

                        fullWidth

                        label="Email"

                        margin="normal"

                        value={email}

                        onChange={(e)=>setEmail(e.target.value)}

                    />

                    <TextField

                        fullWidth

                        label="Password"

                        type="password"

                        margin="normal"

                        value={password}

                        onChange={(e)=>setPassword(e.target.value)}

                    />

                    <Button

                        fullWidth

                        type="submit"


                        variant="contained"

                        sx={{

                            mt:3

                            
                        }}

                    >

                        {loading ? "Logging in..." : "Login"}

                    </Button>

                </form>

            </Paper>

        </Box>

    );

}