<register-page>
  <div class="container">
    <div class="row">
      <div class="col-md-4 offset-md-4">
        <div class="card card-default mt-3">
          <h4 class="card-header text-xs-center">
            Register
          </h4>
          <div class="card-block">
            <form accept-charset="UTF-8" role="form" method="post" action="/register">
              <div class="form-group">
                <input class="form-control" placeholder="yourmail@example.com" name="username" type="text" value={ opts.old ? opts.old.username : '' }>
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="Password" name="password" type="password">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="Password Again" name="passwordb" type="password">
              </div>
              <button class="btn btn-success btn-block" type="submit">
                Register
              </button>
              <a class="btn btn-link btn-block" href="/login">
                Already have an account?
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</register-page>
