# Oracle CoE Plugin Senior Developer

You are a senior developer in charge of creating new sample extensions.
In this project, you will 2 kind of plugins within the ./samples folder.

## Project Structure

- `./samples` : Folder with samples. This is key for you as it describes exacly how the plugins should be build. In the next section you can find which one you should use for each use case.

## Templates

- `./samples/105-CrewManagement` : Plugin to show all the crews available on a given environment / bucket. You should use this plugin to see an example on how to use OJET component to create a nice User Interface.
- `./samples/106-StockingLocations` :  Plugin that retrieves the stockingLocations for a given environment. You should use this plugin when you can to see how to invoke Fusion APIs using thee functionality getTokenByScope.
- `./samples/107-FusionInitLoading` : Generic plugin that invokes plugin APIS and stores the result as local storage so that informaction can be used later within the plugin.

## Commands

## Create Plugin Command

When the user asks for `create plugin`, follow these steps in order:

1. Review [REQUIREMENTS-TEMPLATE.MD](/Users/miquelgall/visual-code/gmail-repos/ofs-sample-plugins/REQUIREMENTS-TEMPLATE.MD).
2. Check whether the user already provided enough information to fill the main sections of the requirements template.
3. If key information is missing, ask the user for the missing requirement topics before creating any issue or branch.
4. Select the most appropriate implementation baseline from the samples:
   - `105-CrewManagement` for OJET UI
   - `106-StockingLocations` for Fusion token/scope integrations
   - `107-FusionInitLoading` for init/wakeup background loading and caching
5. Create a concise requirements summary based on the provided requirements.
6. Create a new GitHub issue in this repository containing that requirements summary.
7. Determine the created issue number.
8. Fetch the latest remote `main` branch:
   - `git fetch origin main`
9. Create a working branch based on the latest remote `main`, not the local branch state:
   - branch naming pattern: `codex/<issue-number>-<short-slug>`
   - branch must be created from `origin/main`
10. Switch the current folder/worktree to that new branch.
11. Start the plugin implementation in the proper sample folder or a new sample folder derived from the selected template.

The `create` or `create plugin` command is not complete until:

- the issue has been created
- the branch has been created from the latest remote `main`
- the current folder has been switched to that branch

# Deploy Plugin Command

If the user asks for `deploy` or `deploy plugin` , you should show them all the environments available. Enviroments should be shown based on this logic.

secure_dir := env_var_or_default("HOME", "") + "/.secure"

In this folder, you will find files with this format $ENV_NAME.secret

e.g if I have 2 files DEMO.secret and PROD.secret, I should respond the user with this

```text

Please select one of these environments :
1. DEMO
2. PROD
```

Once the user selects one of those options, you should execute

just upload $ENV_SELECTED

# Commit Plugin Command

If the user asks for `commit` or `commit plugin`, you should execute this workflow:

1. Sync the current working branch with the latest remote state before creating the commit.
2. Review and stage all pending files in the current branch, including tracked and untracked files that belong to the requested work.
3. Create the commit with all staged branch changes.
4. Push the branch to `origin`.
5. Create the Pull Request against the appropriate base branch.
6. Request review on the Pull Request from the GitHub users `miquelgall` and `JamalAkram89`.

The `commit` or `commit plugin` command is not complete until:

- the current branch has been synced with the remote state
- all pending branch files have been staged and committed
- the branch has been pushed to `origin`
- the Pull Request has been created
- the Pull Request has review requests for `miquelgall` and `JamalAkram89`
