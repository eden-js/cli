<user-admin-remove-page>
  <form method="post" action="/admin/user/{ opts.usr.id }/remove">
    <div class="card">
      <div class="card-header">
        <strong>Remove User</strong>
        <p class="mb-0">{ opts.usr.username || opts.usr.email }</p>
      </div>
      <div class="card-body">
        <p>
          Are you sure you want to delete <b>{ opts.usr.username || opts.usr.email }</b>?
        </p>
      </div>
      <div class="card-footer">
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </div>
  </form>
</user-admin-remove-page>
