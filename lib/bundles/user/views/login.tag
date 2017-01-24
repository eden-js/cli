<login-page>
  <div class="container">
    <div class="row">
      <div class="col-md-4 offset-md-4 mt-3">
        <div class="card card-default">
          <h4 class="card-header text-xs-center">
            Login
          </h4>
          <div class="card-block">
            <form accept-charset="UTF-8" role="form" method="post" action="/login">
              <fieldset>
                <div class="form-group">
                  <input class="form-control" placeholder="yourmail@example.com" name="username" type="text" value={ opts.old ? opts.old.username : '' }>
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="Password" name="password" type="password">
                </div>
                <div class="checkbox">
                  <label>
                    <input name="remember" type="checkbox" value="Remember Me">
                    Remember Me
                  </label>
                </div>
                <input class="btn btn-lg btn-success btn-block" type="submit" value="Login">
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</login-page>
