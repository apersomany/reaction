<script>
	import { onMount } from "svelte";

	let nickname = "";
	let age = "";
	let sex = "";
	let phone = "";
	let isSubmitting = false;
	let error = "";

	onMount(() => {
		const userId = localStorage.getItem("userId");
		if (userId) {
			window.location.replace("/visual");
		}
	});

	async function handleSubmit(event) {
		event.preventDefault();
		error = "";

		if (!nickname.trim()) {
			error = "닉네임을 입력해주세요.";
			return;
		}

		const ageNum = parseInt(age);
		if (!age || ageNum < 1 || ageNum > 120) {
			error = "올바른 나이를 입력해주세요.";
			return;
		}

		if (!sex) {
			error = "성별을 선택해주세요.";
			return;
		}

		isSubmitting = true;

		try {
			const userId = crypto.randomUUID();

			const response = await fetch("/api/user", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: userId,
					nickname: nickname.trim(),
					age: ageNum,
					sex,
					phone: phone.trim() || null,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to save user information");
			}

			localStorage.setItem("userId", userId);
			window.location.replace("/visual");
		} catch (err) {
			error = "정보 저장에 실패했습니다. 다시 시도해주세요.";
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="container">
	<div class="form-card">
		<h1>반응속도 테스트</h1>
		<p class="subtitle">시작하기 전에 정보를 입력해주세요</p>

		<form on:submit={handleSubmit}>
			<div class="form-group">
				<label for="nickname">닉네임 *</label>
				<input
					type="text"
					id="nickname"
					bind:value={nickname}
					placeholder="닉네임을 입력하세요"
					maxlength="20"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-group">
				<label for="age">나이 *</label>
				<input
					type="number"
					id="age"
					bind:value={age}
					placeholder="나이를 입력하세요"
					min="1"
					max="120"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-group">
				<label for="sex">성별 *</label>
				<select id="sex" bind:value={sex} required disabled={isSubmitting}>
					<option value="">선택하세요</option>
					<option value="male">남성</option>
					<option value="female">여성</option>
					<option value="other">기타</option>
				</select>
			</div>

			<div class="form-group">
				<label for="phone">전화번호 (선택)</label>
				<input
					type="tel"
					id="phone"
					bind:value={phone}
					placeholder="010-0000-0000"
					pattern="[0-9-]*"
					maxlength="13"
					disabled={isSubmitting}
				/>
				<small class="help-text">
					경품 추첨 참여를 위해서만 사용되며, 입력 시 개인정보 수집에 동의한 것으로 간주됩니다.
				</small>
			</div>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<button type="submit" class="submit-btn" disabled={isSubmitting}>
				{isSubmitting ? "처리 중..." : "테스트 시작"}
			</button>
		</form>
	</div>
</div>

<style>
	.container {
		width: 100svw;
		height: 100svh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.form-card {
		background: white;
		border-radius: 1.5rem;
		padding: 2rem;
		max-width: 440px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a1a1a;
		text-align: center;
		letter-spacing: -0.5px;
	}

	.subtitle {
		margin: 0 0 1.25rem 0;
		font-size: 0.9rem;
		color: #666;
		text-align: center;
		line-height: 1.5;
	}

	.form-group {
		margin-bottom: 0.875rem;
	}

	label {
		display: block;
		margin-bottom: 0.4rem;
		font-weight: 600;
		color: #2d3748;
		font-size: 0.875rem;
	}

	input,
	select {
		width: 100%;
		padding: 0.75rem 0.875rem;
		border: 2px solid #e2e8f0;
		border-radius: 0.75rem;
		font-size: 1rem;
		transition: all 0.2s;
		box-sizing: border-box;
		font-family: inherit;
		background: white;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	input:disabled,
	select:disabled {
		background-color: #f7fafc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	select {
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		padding-right: 2.5rem;
	}

	.help-text {
		display: block;
		margin-top: 0.4rem;
		font-size: 0.75rem;
		color: #718096;
		line-height: 1.4;
	}

	.error-message {
		background-color: #fff5f5;
		color: #c53030;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		margin-bottom: 0.875rem;
		font-size: 0.875rem;
		text-align: center;
		border: 1px solid #feb2b2;
	}

	.submit-btn {
		width: 100%;
		padding: 0.875rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 0.75rem;
		font-size: 1.05rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 0.25rem;
		letter-spacing: -0.2px;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(102, 126, 234, 0.35);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		opacity: 0.65;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 480px) {
		.form-card {
			border-radius: 0;
			height: 100svh;
			max-width: 100%;
		}

		h1 {
			font-size: 1.5rem;
		}

		.subtitle {
			font-size: 0.85rem;
		}
	}
</style>