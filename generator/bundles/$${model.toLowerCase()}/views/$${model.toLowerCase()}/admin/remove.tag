<$${model.toLowerCase()}-admin-remove-page>
  <div class="page page-shop">

    <admin-header title="Remove $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}">
      <yield to="right">
        <a href="/admin/$${mount}/$${model.toLowerCase()}" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">

      <form method="post" action="/admin/$${mount}/$${model.toLowerCase()}/{ opts.item.id }/remove">
        <div class="card mb-3">
          <div class="card-body">
            <p>
              Are you sure you want to delete this $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}?
            </p>
          </div>
        </div>
        <button type="submit" class="btn btn-lg btn-success">Remove $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}</button>
      </form>

    </div>
  </div>

  <script>
    // do mixins
    this.mixin('i18n');

    // load data
    this.language = this.i18n.lang();

  </script>
</$${model.toLowerCase()}-admin-remove-page>
