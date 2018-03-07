<reset-page>
  <div class="container">
    <div class="row">
      <div class="col-md-4 offset-md-4 mt-3">
        <div class="card card-default">
          <h4 class="card-header text-xs-center">
            Reset Password
          </h4>
          <div class="card-block">
            <form accept-charset="UTF-8" role="form" method="post" action="/reset">
              <input type="hidden" name="token" value={ opts.token } />
              <div class="form-group">
                <input class="form-control" placeholder="Password" name="password" type="password">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="Password Again" name="passwordb" type="password">
              </div>
              <button class="btn btn-success btn-block" type="submit">
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</reset-page>
